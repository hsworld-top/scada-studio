import * as bcrypt from 'bcrypt';

/**
 * 密码工具类
 * @description 提供密码相关的加密、验证和强度检查功能
 * 使用 bcrypt 算法确保密码安全性，支持自定义盐值轮数
 */
export class PasswordUtil {
  /**
   * 默认盐值轮数
   * 轮数越高安全性越好，但计算时间也越长
   * 推荐值：10-12 轮，平衡安全性和性能
   */
  private static readonly DEFAULT_SALT_ROUNDS = 12;

  /**
   * 加密密码
   * @param plainPassword 明文密码
   * @param saltRounds 盐值轮数，默认为 12
   * @returns 加密后的密码哈希值
   * @throws Error 当加密失败时抛出异常
   */
  static async hashPassword(
    plainPassword: string,
    saltRounds: number = PasswordUtil.DEFAULT_SALT_ROUNDS,
  ): Promise<string> {
    try {
      // 验证输入参数
      if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('密码不能为空且必须是字符串');
      }

      if (saltRounds < 4 || saltRounds > 20) {
        throw new Error('盐值轮数必须在 4-20 之间');
      }

      // 使用 bcrypt 加密密码
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`密码加密失败: ${error.message}`);
    }
  }

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 加密后的密码哈希值
   * @returns 密码是否匹配
   * @throws Error 当验证过程出错时抛出异常
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      // 验证输入参数
      if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('明文密码不能为空且必须是字符串');
      }

      if (!hashedPassword || typeof hashedPassword !== 'string') {
        throw new Error('密码哈希值不能为空且必须是字符串');
      }

      // 使用 bcrypt 验证密码
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`密码验证失败: ${error.message}`);
    }
  }

  /**
   * 检查密码强度
   * @param password 待检查的密码
   * @param requirements 密码要求配置
   * @returns 密码强度检查结果
   */
  static checkPasswordStrength(
    password: string,
    requirements: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
      forbiddenPatterns?: string[];
    } = {},
  ): {
    isValid: boolean;
    score: number; // 0-100 分
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 设置默认要求
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      forbiddenPatterns = [],
    } = requirements;

    // 检查密码长度
    if (password.length < minLength) {
      issues.push(`密码长度不能少于 ${minLength} 个字符`);
      suggestions.push(`请增加密码长度至 ${minLength} 个字符以上`);
    } else {
      score += Math.min(25, (password.length / minLength) * 25);
    }

    // 检查大写字母
    if (requireUppercase && !/[A-Z]/.test(password)) {
      issues.push('密码必须包含至少一个大写字母');
      suggestions.push('请添加大写字母（A-Z）');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    // 检查小写字母
    if (requireLowercase && !/[a-z]/.test(password)) {
      issues.push('密码必须包含至少一个小写字母');
      suggestions.push('请添加小写字母（a-z）');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    // 检查数字
    if (requireNumbers && !/\d/.test(password)) {
      issues.push('密码必须包含至少一个数字');
      suggestions.push('请添加数字（0-9）');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    // 检查特殊字符
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('密码必须包含至少一个特殊字符');
      suggestions.push('请添加特殊字符（如 !@#$%^&*）');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 15;
    }

    // 检查字符多样性
    const uniqueChars = new Set(password).size;
    const diversityRatio = uniqueChars / password.length;
    if (diversityRatio > 0.7) {
      score += 15;
    } else if (diversityRatio < 0.3) {
      suggestions.push('请避免重复使用相同字符');
    }

    // 检查禁用模式
    for (const pattern of forbiddenPatterns) {
      if (password.toLowerCase().includes(pattern.toLowerCase())) {
        issues.push(`密码不能包含禁用词汇: ${pattern}`);
        score = Math.max(0, score - 20);
      }
    }

    // 检查常见弱密码模式
    const weakPatterns = [
      /^(.)\1+$/, // 全部相同字符
      /^(012|123|234|345|456|567|678|789|890)+/, // 连续数字
      /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // 连续字母
      /^(qwer|asdf|zxcv|qaz|wsx|edc)+/i, // 键盘模式
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        issues.push('密码包含常见的弱密码模式');
        suggestions.push('请避免使用键盘顺序或重复字符');
        score = Math.max(0, score - 15);
        break;
      }
    }

    return {
      isValid: issues.length === 0,
      score: Math.min(100, Math.max(0, score)),
      issues,
      suggestions,
    };
  }

  /**
   * 生成随机密码
   * @param length 密码长度
   * @param options 生成选项
   * @returns 生成的随机密码
   */
  static generateRandomPassword(
    length: number = 12,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
      excludeSimilar?: boolean; // 排除相似字符如 0O, 1l, I
    } = {},
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true,
    } = options;

    let charset = '';

    if (includeUppercase) {
      charset += excludeSimilar
        ? 'ABCDEFGHJKLMNPQRSTUVWXYZ'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (includeLowercase) {
      charset += excludeSimilar
        ? 'abcdefghijkmnopqrstuvwxyz'
        : 'abcdefghijklmnopqrstuvwxyz';
    }

    if (includeNumbers) {
      charset += excludeSimilar ? '23456789' : '0123456789';
    }

    if (includeSpecialChars) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (!charset) {
      throw new Error('至少需要选择一种字符类型');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}
