import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  usedAt?: Date;
}

interface PublicKeyResponse {
  keyId: string;
  publicKey: string;
  expiresIn: number; // 过期时间（秒）
}

/**
 * RSA加密解密工具类
 * 动态生成密钥对，用于前端密码加密传输的安全处理
 */
@Injectable()
export class CryptoUtil {
  private readonly logger = new Logger(CryptoUtil.name);

  // 密钥对缓存Map
  private readonly keyPairCache = new Map<string, KeyPair>();

  // 配置参数
  private readonly KEY_EXPIRY_MINUTES = 10; // 密钥对过期时间（分钟）
  private readonly MAX_CACHED_KEYS = 10000; // 最大缓存密钥对数量
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 清理间隔（5分钟）

  constructor() {
    this.startCleanupTimer();
    this.logger.log('动态RSA密钥管理器已启动');
  }

  /**
   * 生成新的密钥对并返回公钥信息
   */
  generateKeyPair(): PublicKeyResponse {
    // 生成唯一的密钥标识
    const keyId = this.generateKeyId();

    // 生成RSA密钥对
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // 存储到缓存
    const keyPair: KeyPair = {
      publicKey,
      privateKey,
      createdAt: new Date(),
    };

    this.keyPairCache.set(keyId, keyPair);

    this.logger.debug(
      `新密钥对已生成: ${keyId}, 当前缓存数量: ${this.keyPairCache.size}`,
    );

    // 检查缓存大小限制
    this.enforceMaxCacheSize();

    return {
      keyId,
      publicKey,
      expiresIn: this.KEY_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * 解密前端传来的加密密码
   * @param keyId 密钥标识
   * @param encryptedPassword Base64编码的加密密码
   * @returns 解密后的明文密码
   */
  decryptPassword(keyId: string, encryptedPassword: string): string {
    try {
      // 获取对应的密钥对
      const keyPair = this.keyPairCache.get(keyId);
      if (!keyPair) {
        throw new Error(`密钥对不存在或已过期: ${keyId}`);
      }

      // 更新使用时间
      keyPair.usedAt = new Date();

      // 将Base64编码的密文转换为Buffer
      const encryptedBuffer = Buffer.from(encryptedPassword, 'base64');

      // 使用私钥解密
      const decrypted = crypto.privateDecrypt(
        {
          key: keyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer,
      );

      const result = decrypted.toString('utf8');

      // 解密成功后立即删除密钥对（一次性使用）
      this.keyPairCache.delete(keyId);
      this.logger.debug(
        `密钥对已使用并删除: ${keyId}, 剩余缓存数量: ${this.keyPairCache.size}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`密码解密失败 (keyId: ${keyId}):`, error.message);
      // 删除无效的密钥对
      this.keyPairCache.delete(keyId);
      throw new Error('密码解密失败，请重新获取公钥');
    }
  }

  /**
   * 检查是否有keyId（用于判断是否为新的加密方式）
   * @param keyId 密钥标识
   * @returns 是否存在对应的密钥对
   */
  hasKeyId(keyId: string): boolean {
    return this.keyPairCache.has(keyId);
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      totalKeys: this.keyPairCache.size,
      maxKeys: this.MAX_CACHED_KEYS,
      expiryMinutes: this.KEY_EXPIRY_MINUTES,
    };
  }

  /**
   * 生成唯一的密钥标识
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `key_${timestamp}_${random}`;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, this.CLEANUP_INTERVAL);

    this.logger.debug(
      `清理定时器已启动，间隔: ${this.CLEANUP_INTERVAL / 1000}秒`,
    );
  }

  /**
   * 清理过期的密钥对
   */
  private cleanupExpiredKeys(): void {
    const now = new Date();
    const expiryTime = this.KEY_EXPIRY_MINUTES * 60 * 1000;
    let cleanedCount = 0;

    for (const [keyId, keyPair] of this.keyPairCache.entries()) {
      const ageMs = now.getTime() - keyPair.createdAt.getTime();
      if (ageMs > expiryTime) {
        this.keyPairCache.delete(keyId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(
        `清理了 ${cleanedCount} 个过期密钥对，剩余: ${this.keyPairCache.size}`,
      );
    }
  }

  /**
   * 强制执行最大缓存大小限制
   */
  private enforceMaxCacheSize(): void {
    if (this.keyPairCache.size <= this.MAX_CACHED_KEYS) {
      return;
    }

    // 按创建时间排序，删除最旧的密钥对
    const entries = Array.from(this.keyPairCache.entries());
    entries.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());

    const toDelete = entries.slice(
      0,
      this.keyPairCache.size - this.MAX_CACHED_KEYS,
    );
    for (const [keyId] of toDelete) {
      this.keyPairCache.delete(keyId);
    }

    this.logger.warn(
      `缓存已满，删除了 ${toDelete.length} 个最旧的密钥对，当前数量: ${this.keyPairCache.size}`,
    );
  }
}
