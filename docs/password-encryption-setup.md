# 密码加密功能配置指南

## 概述

本文档介绍如何配置RSA密钥对，启用前端密码加密传输功能。

## 1. 生成RSA密钥对

### 方法一：使用Node.js脚本生成（推荐）

创建密钥生成脚本：

```javascript
// scripts/generate-rsa-keys.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 生成RSA密钥对并保存到文件
 */
function generateRSAKeys() {
  console.log('正在生成RSA密钥对...');

  // 生成2048位RSA密钥对
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

  // 创建keys目录
  const keysDir = path.join(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // 保存密钥到文件
  fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);
  fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);

  console.log('密钥对已生成并保存到 keys/ 目录');
  console.log('\n=== 公钥 ===');
  console.log(publicKey);
  console.log('\n=== 私钥 ===');
  console.log(privateKey);

  // 生成环境变量格式
  console.log('\n=== 环境变量配置 ===');
  console.log('请将以下内容添加到 .env 文件中：\n');

  const publicKeyEscaped = publicKey.replace(/\n/g, '\\n');
  const privateKeyEscaped = privateKey.replace(/\n/g, '\\n');

  console.log(`# RSA密钥对配置（密码加密功能）`);
  console.log(`RSA_PUBLIC_KEY="${publicKeyEscaped}"`);
  console.log(`RSA_PRIVATE_KEY="${privateKeyEscaped}"`);

  console.log('\n注意：');
  console.log('1. 请妥善保管私钥，不要泄露或提交到版本控制');
  console.log('2. 生产环境建议使用更安全的密钥管理方案');
  console.log('3. keys/ 目录已添加到 .gitignore，不会被提交到git');
}

// 执行生成
generateRSAKeys();
```

运行脚本：

```bash
node scripts/generate-rsa-keys.js
```

### 方法二：使用OpenSSL生成

```bash
# 生成私钥
openssl genrsa -out private.pem 2048

# 生成公钥
openssl rsa -in private.pem -pubout -out public.pem

# 查看生成的密钥
echo "=== 公钥 ==="
cat public.pem

echo "=== 私钥 ==="
cat private.pem
```

### 方法三：使用CryptoUtil工具类生成

```typescript
// 在代码中直接调用生成方法
import { CryptoUtil } from './apps/api-gateway/src/common/utils/crypto.util';

// 生成并打印密钥对
CryptoUtil.generateProductionKeys();
```

## 2. 环境变量配置

### 开发环境配置

在API网关根目录创建 `.env` 文件：

```bash
# apps/api-gateway/.env

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d
JWT_REFRESH_SECRET=your-refresh-secret-key

# RSA密钥配置（密码加密功能）
RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# 微服务地址配置
AUTH_SERVICE_HOST=127.0.0.1
AUTH_SERVICE_PORT=3002
PROJECT_STUDIO_HOST=127.0.0.1
PROJECT_STUDIO_PORT=3003
```

### 生产环境配置

```bash
# 生产环境 .env

# 更强的JWT密钥
JWT_SECRET=very-strong-random-secret-key-for-production
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d
JWT_REFRESH_SECRET=another-strong-refresh-secret-key

# 生产环境RSA密钥对
RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n生产环境公钥内容...\n-----END PUBLIC KEY-----"
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n生产环境私钥内容...\n-----END PRIVATE KEY-----"

# 生产环境微服务地址
AUTH_SERVICE_HOST=auth-service.internal
AUTH_SERVICE_PORT=3002
PROJECT_STUDIO_HOST=project-studio.internal
PROJECT_STUDIO_PORT=3003

# 启用HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
```

### Docker环境配置

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-gateway:
    build: ./apps/api-gateway
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ACCESS_TOKEN_TTL=15m
      - JWT_REFRESH_TOKEN_TTL=7d
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - RSA_PUBLIC_KEY=${RSA_PUBLIC_KEY}
      - RSA_PRIVATE_KEY=${RSA_PRIVATE_KEY}
      - AUTH_SERVICE_HOST=auth-service
      - AUTH_SERVICE_PORT=3002
    ports:
      - '3001:3001'
    depends_on:
      - auth-service

  auth-service:
    build: ./apps/auth-service
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - '3002:3002'
```

## 3. 安全配置

### .gitignore 配置

确保敏感文件不被提交到版本控制：

```gitignore
# 环境变量文件
.env
.env.local
.env.development
.env.production

# RSA密钥文件
keys/
*.pem
*.key
*.crt

# 其他敏感文件
secrets/
certs/
```

### 密钥文件权限设置（Linux/macOS）

```bash
# 设置密钥文件权限（仅所有者可读）
chmod 600 keys/private.pem
chmod 644 keys/public.pem

# 设置目录权限
chmod 700 keys/
```

## 4. 验证配置

### 测试脚本

创建测试脚本验证配置：

```javascript
// scripts/test-password-encryption.js
const crypto = require('crypto');

// 从环境变量读取密钥
const publicKeyPem = process.env.RSA_PUBLIC_KEY?.replace(/\\n/g, '\n');
const privateKeyPem = process.env.RSA_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!publicKeyPem || !privateKeyPem) {
  console.error('错误：未配置RSA密钥环境变量');
  process.exit(1);
}

console.log('开始测试RSA密钥配置...');

try {
  // 测试密码
  const testPassword = 'test123456';

  // 使用公钥加密
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(testPassword, 'utf8'),
  );

  const encryptedBase64 = encrypted.toString('base64');
  console.log('✅ 加密测试成功');
  console.log('加密结果:', encryptedBase64);

  // 使用私钥解密
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encrypted,
  );

  const decryptedPassword = decrypted.toString('utf8');
  console.log('✅ 解密测试成功');
  console.log('解密结果:', decryptedPassword);

  // 验证结果
  if (decryptedPassword === testPassword) {
    console.log('✅ RSA密钥配置正确，加密解密功能正常');
  } else {
    console.error('❌ 解密结果不匹配，请检查密钥配置');
  }
} catch (error) {
  console.error('❌ RSA测试失败:', error.message);
  process.exit(1);
}
```

运行测试：

```bash
# 加载环境变量并运行测试
source .env && node scripts/test-password-encryption.js
```

### API测试

```bash
# 1. 获取公钥
curl -X GET http://localhost:3001/api/auth/public-key

# 2. 测试登录接口（使用明文密码）
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSlug": "default",
    "username": "test",
    "password": "plaintext-password"
  }'

# 3. 测试登录接口（使用加密密码）
# 需要先用获取的公钥加密密码，然后发送请求
```

## 5. 监控和日志

### 日志配置

确保CryptoUtil的日志正确配置：

```typescript
// 在main.ts中配置日志级别
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    logger: ['log', 'error', 'warn', 'debug'], // 启用debug日志查看密钥加载情况
  });

  // 启动时验证RSA配置
  const logger = new Logger('Bootstrap');
  logger.log('验证RSA密钥配置...');

  await app.listen(3001);
}
```

### 监控指标

添加密码加密功能的监控指标：

```typescript
// 在CryptoUtil中添加指标统计
export class CryptoUtil {
  private static encryptionAttempts = 0;
  private static encryptionFailures = 0;

  decryptPassword(encryptedPassword: string): string {
    CryptoUtil.encryptionAttempts++;

    try {
      // 解密逻辑...
      return decrypted.toString('utf8');
    } catch (error) {
      CryptoUtil.encryptionFailures++;
      this.logger.error(
        `密码解密失败 (${CryptoUtil.encryptionFailures}/${CryptoUtil.encryptionAttempts}):`,
        error.message,
      );
      throw error;
    }
  }

  static getMetrics() {
    return {
      encryptionAttempts: CryptoUtil.encryptionAttempts,
      encryptionFailures: CryptoUtil.encryptionFailures,
      successRate:
        CryptoUtil.encryptionAttempts > 0
          ? (CryptoUtil.encryptionAttempts - CryptoUtil.encryptionFailures) /
            CryptoUtil.encryptionAttempts
          : 0,
    };
  }
}
```

## 6. 故障排除

### 常见问题

1. **环境变量格式错误**

   ```
   错误：密码解密失败: error:0909006C:PEM routines:get_name:no start line
   解决：检查环境变量中的换行符是否正确转义为 \n
   ```

2. **密钥格式不匹配**

   ```
   错误：密码解密失败: error:04099079:rsa routines:RSA_padding_check_OAEP:oaep decoding error
   解决：确保前端和后端使用相同的加密算法和参数
   ```

3. **密钥未加载**
   ```
   错误：未配置RSA密钥环境变量，使用临时生成的密钥对
   解决：检查.env文件是否正确配置并被加载
   ```

### 调试步骤

1. **验证环境变量加载**

   ```javascript
   console.log(
     'RSA_PUBLIC_KEY:',
     process.env.RSA_PUBLIC_KEY ? '已配置' : '未配置',
   );
   console.log(
     'RSA_PRIVATE_KEY:',
     process.env.RSA_PRIVATE_KEY ? '已配置' : '未配置',
   );
   ```

2. **验证密钥格式**

   ```javascript
   const publicKey = process.env.RSA_PUBLIC_KEY?.replace(/\\n/g, '\n');
   console.log(
     '公钥格式检查:',
     publicKey?.startsWith('-----BEGIN PUBLIC KEY-----'),
   );
   ```

3. **启用调试日志**
   ```bash
   DEBUG=* npm run start:dev
   ```

## 7. 性能优化建议

1. **密钥缓存**: 避免每次请求都解析密钥
2. **错误缓存**: 避免重复尝试无效的解密操作
3. **批量处理**: 如有大量加密操作，考虑批量处理
4. **监控告警**: 设置解密失败率告警阈值

## 8. 安全建议

1. **定期轮换密钥**: 建议每3-6个月更换一次RSA密钥对
2. **密钥备份**: 安全备份私钥，防止丢失
3. **访问控制**: 限制对私钥的访问权限
4. **审计日志**: 记录所有密钥相关操作
5. **HTTPS强制**: 生产环境必须使用HTTPS
