# 前端密码加密示例

## 概述

为了提高登录安全性，系统支持前端RSA密码加密传输。密码在前端加密后传输到API网关，网关解密后再传递给内部微服务，确保密码在网络传输过程中的安全性。

## 技术方案

- **加密算法**: RSA-OAEP
- **密钥长度**: 2048位
- **哈希算法**: SHA-256
- **编码格式**: Base64

## 前端实现

### 1. 安装依赖

```bash
# 使用 crypto-js (推荐)
npm install crypto-js
npm install @types/crypto-js  # TypeScript项目需要

# 或使用 node-forge
npm install node-forge
npm install @types/node-forge  # TypeScript项目需要
```

### 2. 使用 crypto-js 实现 (推荐)

```typescript
import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';

/**
 * 密码加密工具类
 */
export class PasswordEncryption {
  private publicKey: string | null = null;

  /**
   * 获取服务器公钥
   */
  async getPublicKey(): Promise<string> {
    if (this.publicKey) {
      return this.publicKey;
    }

    try {
      const response = await fetch('/api/auth/public-key');
      const result = await response.json();

      if (result.code === 0 && result.data?.publicKey) {
        this.publicKey = result.data.publicKey;
        return this.publicKey;
      } else {
        throw new Error('获取公钥失败');
      }
    } catch (error) {
      console.error('获取公钥失败:', error);
      throw error;
    }
  }

  /**
   * 加密密码
   * @param password 明文密码
   * @returns Base64编码的加密密码
   */
  async encryptPassword(password: string): Promise<string> {
    try {
      const publicKey = await this.getPublicKey();

      // 使用 JSEncrypt 进行RSA加密
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(publicKey);

      const encrypted = encrypt.encrypt(password);
      if (!encrypted) {
        throw new Error('密码加密失败');
      }

      return encrypted;
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
      await this.getPublicKey();
      return true;
    } catch (error) {
      console.warn('密码加密功能不可用，将使用明文传输:', error.message);
      return false;
    }
  }
}

// 创建全局实例
const passwordEncryption = new PasswordEncryption();
export default passwordEncryption;
```

### 3. 在登录组件中使用

```typescript
import passwordEncryption from './utils/password-encryption';

interface LoginForm {
  tenantSlug: string;
  username: string;
  password: string;
  captchaId?: string;
  captchaText?: string;
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
        await passwordEncryption.isEncryptionSupported();

      // 2. 准备登录数据
      const loginData: LoginForm = {
        ...formData,
      };

      // 3. 如果支持加密，则加密密码
      if (encryptionSupported) {
        try {
          loginData.password = await passwordEncryption.encryptPassword(
            formData.password,
          );
          console.log('密码已加密传输');
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
import passwordEncryption from '../utils/password-encryption';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (loginData: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      // 尝试加密密码
      const encryptionSupported =
        await passwordEncryption.isEncryptionSupported();
      const processedData = { ...loginData };

      if (encryptionSupported) {
        try {
          processedData.password = await passwordEncryption.encryptPassword(
            loginData.password,
          );
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
import passwordEncryption from '../utils/password-encryption';

export const useLogin = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const login = async (loginData: LoginForm) => {
    loading.value = true;
    error.value = null;

    try {
      // 加密密码
      const encryptionSupported =
        await passwordEncryption.isEncryptionSupported();
      const processedData = { ...loginData };

      if (encryptionSupported) {
        try {
          processedData.password = await passwordEncryption.encryptPassword(
            loginData.password,
          );
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

### 6. 使用 node-forge 的替代实现

```typescript
import { pki, util } from 'node-forge';

export class PasswordEncryptionForge {
  private publicKey: string | null = null;

  async encryptPassword(password: string): Promise<string> {
    try {
      const publicKeyPem = await this.getPublicKey();

      // 解析PEM格式的公钥
      const publicKey = pki.publicKeyFromPem(publicKeyPem);

      // 使用RSA-OAEP加密
      const encrypted = publicKey.encrypt(password, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create(),
        },
      });

      // 转换为Base64
      return util.encode64(encrypted);
    } catch (error) {
      console.error('密码加密失败:', error);
      throw error;
    }
  }

  // ... 其他方法类似上面的实现
}
```

## 安全注意事项

1. **公钥缓存**: 公钥获取后可以缓存，避免每次登录都请求
2. **错误处理**: 加密失败时应降级为明文传输，保证功能可用性
3. **HTTPS**: 生产环境必须使用HTTPS，即使有RSA加密
4. **密钥轮换**: 定期更换RSA密钥对
5. **客户端安全**: 确保前端代码不被恶意篡改

## 兼容性方案

为了确保平滑过渡，系统同时支持：

- ✅ **加密密码**: 前端使用RSA加密的密码
- ✅ **明文密码**: 未升级的客户端仍可正常使用
- ✅ **自动降级**: 加密失败时自动使用明文传输

## 测试验证

```typescript
// 测试密码加密功能
async function testPasswordEncryption() {
  const testPassword = 'test123456';

  try {
    // 1. 获取公钥
    console.log('获取公钥...');
    const publicKey = await passwordEncryption.getPublicKey();
    console.log('公钥获取成功');

    // 2. 加密密码
    console.log('加密密码...');
    const encryptedPassword =
      await passwordEncryption.encryptPassword(testPassword);
    console.log('密码加密成功:', encryptedPassword);

    // 3. 测试登录
    console.log('测试登录...');
    const loginResult = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: 'default',
        username: 'test',
        password: encryptedPassword,
      }),
    });

    console.log('登录测试完成');
  } catch (error) {
    console.error('测试失败:', error);
  }
}
```

## 性能优化

1. **公钥缓存**: 将公钥缓存到 localStorage 或 sessionStorage
2. **延迟加载**: 只在需要时才加载加密库
3. **Web Worker**: 大量加密操作可考虑在 Web Worker 中进行

```typescript
// 公钥缓存示例
export class PasswordEncryptionWithCache {
  private static readonly CACHE_KEY = 'rsa_public_key';
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

  async getPublicKey(): Promise<string> {
    // 尝试从缓存获取
    const cached = this.getCachedPublicKey();
    if (cached) {
      return cached;
    }

    // 从服务器获取并缓存
    const publicKey = await this.fetchPublicKeyFromServer();
    this.cachePublicKey(publicKey);
    return publicKey;
  }

  private getCachedPublicKey(): string | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { publicKey, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > PasswordEncryptionWithCache.CACHE_TTL) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return publicKey;
    } catch {
      return null;
    }
  }

  private cachePublicKey(publicKey: string): void {
    try {
      localStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify({
          publicKey,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.warn('公钥缓存失败:', error);
    }
  }
}
```
