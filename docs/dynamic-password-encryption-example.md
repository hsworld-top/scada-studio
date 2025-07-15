# 前端密码加密示例（动态密钥版本）

## 概述

为了提高登录安全性，系统支持前端RSA密码加密传输。系统采用动态密钥管理方式：

- 每次请求公钥时生成新的密钥对
- 返回公钥和唯一标识(keyId)
- 登录时传递keyId和加密密码
- 解密成功后立即删除密钥对（一次性使用）

## 技术方案

- **加密算法**: RSA-OAEP
- **密钥长度**: 2048位
- **哈希算法**: SHA-256
- **编码格式**: Base64
- **密钥管理**: 动态生成，一次性使用
- **缓存策略**: 内存Map缓存，10分钟过期

## 前端实现

### 1. 安装依赖

```bash
# 使用 jsencrypt (推荐)
npm install jsencrypt
npm install @types/jsencrypt  # TypeScript项目需要
```

### 2. 密码加密工具类

```typescript
import { JSEncrypt } from 'jsencrypt';

interface PublicKeyResponse {
  keyId: string;
  publicKey: string;
  expiresIn: number;
  algorithm: string;
  keySize: number;
  hash: string;
  usage: string;
}

/**
 * 动态密码加密工具类
 */
export class DynamicPasswordEncryption {
  private keyCache = new Map<
    string,
    { publicKey: string; expiresAt: number }
  >();

  /**
   * 获取服务器公钥和密钥标识
   */
  async getPublicKeyInfo(): Promise<PublicKeyResponse> {
    try {
      const response = await fetch('/api/auth/public-key');
      const result = await response.json();

      if (result.code === 0 && result.data) {
        // 缓存公钥信息（可选，用于减少网络请求）
        const keyInfo = result.data;
        this.keyCache.set(keyInfo.keyId, {
          publicKey: keyInfo.publicKey,
          expiresAt: Date.now() + keyInfo.expiresIn * 1000,
        });

        return keyInfo;
      } else {
        throw new Error('获取公钥失败: ' + result.msg);
      }
    } catch (error) {
      console.error('获取公钥失败:', error);
      throw error;
    }
  }

  /**
   * 加密密码
   * @param password 明文密码
   * @returns { keyId, encryptedPassword }
   */
  async encryptPassword(
    password: string,
  ): Promise<{ keyId: string; encryptedPassword: string }> {
    try {
      // 获取新的公钥和keyId
      const keyInfo = await this.getPublicKeyInfo();

      // 使用 JSEncrypt 进行RSA加密
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(keyInfo.publicKey);

      const encryptedPassword = encrypt.encrypt(password);
      if (!encryptedPassword) {
        throw new Error('密码加密失败');
      }

      return {
        keyId: keyInfo.keyId,
        encryptedPassword,
      };
    } catch (error) {
      console.error('密码加密失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否支持加密功能
   */
  async isEncryptionSupported(): Promise<boolean> {
    try {
      await this.getPublicKeyInfo();
      return true;
    } catch (error) {
      console.warn('密码加密功能不可用，将使用明文传输:', error.message);
      return false;
    }
  }

  /**
   * 清理过期的密钥缓存
   */
  private cleanupExpiredKeys(): void {
    const now = Date.now();
    for (const [keyId, keyData] of this.keyCache.entries()) {
      if (now > keyData.expiresAt) {
        this.keyCache.delete(keyId);
      }
    }
  }
}

// 创建全局实例
const dynamicPasswordEncryption = new DynamicPasswordEncryption();
export default dynamicPasswordEncryption;
```

### 3. 登录接口调用

```typescript
import dynamicPasswordEncryption from './utils/dynamic-password-encryption';

interface LoginForm {
  tenantSlug: string;
  username: string;
  password: string;
  captchaId?: string;
  captchaText?: string;
  keyId?: string; // 新增：密钥标识
}

/**
 * 登录组件
 */
export class LoginComponent {
  /**
   * 处理登录
   */
  async handleLogin(formData: LoginForm) {
    try {
      // 1. 检查是否支持密码加密
      const encryptionSupported =
        await dynamicPasswordEncryption.isEncryptionSupported();

      // 2. 准备登录数据
      const loginData: LoginForm = {
        tenantSlug: formData.tenantSlug,
        username: formData.username,
        password: formData.password,
        captchaId: formData.captchaId,
        captchaText: formData.captchaText,
      };

      // 3. 如果支持加密，则加密密码
      if (encryptionSupported) {
        try {
          const { keyId, encryptedPassword } =
            await dynamicPasswordEncryption.encryptPassword(formData.password);
          loginData.password = encryptedPassword;
          loginData.keyId = keyId;
          console.log('密码已加密传输，keyId:', keyId);
        } catch (encryptError) {
          console.warn('密码加密失败，使用明文传输:', encryptError.message);
          // 加密失败时仍使用原密码，保证功能可用性
        }
      }

      // 4. 发送登录请求
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (result.code === 0) {
        // 登录成功
        console.log('登录成功:', result.data);
        // 保存token等后续处理...
      } else {
        // 登录失败
        console.error('登录失败:', result.msg);
        throw new Error(result.msg);
      }
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  }
}
```

### 4. React Hook 示例

```tsx
import React, { useState, useCallback } from 'react';
import dynamicPasswordEncryption from '../utils/dynamic-password-encryption';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (loginData: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      // 尝试加密密码
      const encryptionSupported =
        await dynamicPasswordEncryption.isEncryptionSupported();
      const processedData = { ...loginData };

      if (encryptionSupported) {
        try {
          const { keyId, encryptedPassword } =
            await dynamicPasswordEncryption.encryptPassword(loginData.password);
          processedData.password = encryptedPassword;
          processedData.keyId = keyId;
        } catch (encryptError) {
          console.warn('密码加密失败，使用明文传输');
        }
      }

      // 发送登录请求
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      });

      const result = await response.json();

      if (result.code === 0) {
        return result.data;
      } else {
        throw new Error(result.msg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
};

// 使用示例
export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    tenantSlug: '',
    username: '',
    password: '',
  });

  const { login, loading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(formData);
      console.log('登录成功:', result);
      // 处理登录成功逻辑...
    } catch (err) {
      console.error('登录失败:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段... */}
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### 5. Vue.js 示例

```typescript
// composables/useLogin.ts
import { ref } from 'vue';
import dynamicPasswordEncryption from '../utils/dynamic-password-encryption';

export const useLogin = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const login = async (loginData: LoginForm) => {
    loading.value = true;
    error.value = null;

    try {
      // 加密密码
      const encryptionSupported =
        await dynamicPasswordEncryption.isEncryptionSupported();
      const processedData = { ...loginData };

      if (encryptionSupported) {
        try {
          const { keyId, encryptedPassword } =
            await dynamicPasswordEncryption.encryptPassword(loginData.password);
          processedData.password = encryptedPassword;
          processedData.keyId = keyId;
        } catch (encryptError) {
          console.warn('密码加密失败，使用明文传输');
        }
      }

      // 发送请求
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: processedData,
      });

      if (response.code === 0) {
        return response.data;
      } else {
        throw new Error(response.msg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { login, loading, error };
};
```

## 安全特性和优势

### ✅ 安全优势

1. **一次性密钥**: 每次登录使用全新的密钥对
2. **自动清理**: 解密成功后立即删除密钥对
3. **防重放攻击**: 密钥对只能使用一次
4. **无配置依赖**: 不需要预先配置密钥
5. **动态过期**: 10分钟自动过期机制

### ⚠️ 注意事项

1. **网络请求增加**: 每次登录前需要获取公钥
2. **内存消耗**: 服务器端缓存密钥对
3. **时效性**: 密钥对有效期较短，需要及时使用
4. **兼容性**: 仍兼容明文密码登录

## 错误处理

### 常见错误场景

```typescript
// 1. 密钥过期
if (error.message.includes('密钥对不存在或已过期')) {
  // 重新获取公钥并重试
  console.log('密钥已过期，重新获取公钥');
}

// 2. 解密失败
if (error.message.includes('密码解密失败')) {
  // 提示用户重新输入
  console.log('解密失败，请检查密码并重试');
}

// 3. 公钥获取失败
if (error.message.includes('获取公钥失败')) {
  // 降级为明文传输
  console.log('降级为明文传输');
}
```

## 性能优化

### 1. 公钥缓存策略

```typescript
// 短期缓存公钥，避免重复请求
class OptimizedPasswordEncryption extends DynamicPasswordEncryption {
  private lastKeyInfo: PublicKeyResponse | null = null;
  private lastKeyTime = 0;
  private KEY_CACHE_TIME = 30 * 1000; // 30秒缓存

  async getPublicKeyInfo(): Promise<PublicKeyResponse> {
    const now = Date.now();
    if (this.lastKeyInfo && now - this.lastKeyTime < this.KEY_CACHE_TIME) {
      return this.lastKeyInfo;
    }

    this.lastKeyInfo = await super.getPublicKeyInfo();
    this.lastKeyTime = now;
    return this.lastKeyInfo;
  }
}
```

### 2. 预加载公钥

```typescript
// 在页面加载时预加载公钥
window.addEventListener('load', async () => {
  try {
    await dynamicPasswordEncryption.getPublicKeyInfo();
    console.log('公钥预加载成功');
  } catch (error) {
    console.warn('公钥预加载失败:', error);
  }
});
```

## 测试验证

```typescript
// 测试动态密码加密功能
async function testDynamicPasswordEncryption() {
  const testPassword = 'test123456';

  try {
    console.log('1. 测试获取公钥...');
    const keyInfo = await dynamicPasswordEncryption.getPublicKeyInfo();
    console.log('✅ 公钥获取成功:', keyInfo.keyId);

    console.log('2. 测试密码加密...');
    const { keyId, encryptedPassword } =
      await dynamicPasswordEncryption.encryptPassword(testPassword);
    console.log('✅ 密码加密成功:', keyId);

    console.log('3. 测试登录...');
    const loginResult = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: 'default',
        username: 'test',
        password: encryptedPassword,
        keyId: keyId,
      }),
    });

    console.log('✅ 登录测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}
```

## 监控统计

### 服务器端监控

```typescript
// 在auth.controller.ts中添加统计端点
@Get('encryption-stats')
@HttpCode(HttpStatus.OK)
getEncryptionStats() {
  const stats = this.cryptoUtil.getCacheStats();
  return ResponseUtil.success(stats, '统计信息获取成功');
}
```

### 前端使用统计

```typescript
// 记录加密使用情况
class EncryptionStatsCollector {
  private stats = {
    totalAttempts: 0,
    successfulEncryptions: 0,
    failures: 0,
  };

  recordAttempt() {
    this.stats.totalAttempts++;
  }

  recordSuccess() {
    this.stats.successfulEncryptions++;
  }

  recordFailure() {
    this.stats.failures++;
  }

  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalAttempts > 0
          ? this.stats.successfulEncryptions / this.stats.totalAttempts
          : 0,
    };
  }
}
```

## 总结

动态密钥管理方式提供了：

- ✅ **更高的安全性**: 一次性密钥对，防重放攻击
- ✅ **更简单的部署**: 无需预先配置密钥
- ✅ **自动化管理**: 自动生成、使用、清理
- ✅ **向后兼容**: 支持明文密码降级
- ✅ **灵活配置**: 可调整过期时间和缓存大小

这种方式特别适合开发环境和对安全性要求较高的场景。
