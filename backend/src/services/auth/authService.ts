/**
 * 认证服务 - 新版本
 * 
 * 完全基于环境变量驱动，支持 PostgreSQL 总系统
 */

import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Pool } from 'pg';
import { AUTH_TABLES } from '../../config/tables';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  subscriptionType: string;
  createdAt: Date;
}

export class AuthService {
  private pool: Pool;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor(pool: Pool) {
    this.pool = pool;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-this';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (this.jwtSecret === 'default-secret-change-this') {
      console.warn('⚠️ 使用默认 JWT_SECRET,生产环境请修改!');
    }

    console.log('🔐 认证服务初始化完成');
    console.log(`  - 使用表: ${AUTH_TABLES.USERS}`);
    console.log(`  - Token 有效期: ${this.jwtExpiresIn}`);
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<{ user: User; token: string; refreshToken?: string }> {
    const { username, email, password, displayName } = data;

    console.log(`📝 注册请求: ${email}`);

    // 1. 验证用户是否已存在
    const existingUser = await this.checkUserExists(email, username);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('该邮箱已被注册');
      }
      if (existingUser.username === username) {
        throw new Error('该用户名已被使用');
      }
    }

    // 2. 密码加密
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. 插入用户
    const insertQuery = `
      INSERT INTO ${AUTH_TABLES.USERS} 
        (username, email, password_hash, display_name, role, subscription_type, status, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, username, email, display_name, role, subscription_type, created_at
    `;

    const values = [
      username,
      email,
      passwordHash,
      displayName || username,
      'user',
      'free',
      'active'
    ];

    console.log(`💾 插入用户到表: ${AUTH_TABLES.USERS}`);

    const result = await this.pool.query(insertQuery, values);
    const user = result.rows[0];

    console.log(`✅ 用户注册成功: ${user.email} (ID: ${user.id})`);

    // 4. 生成 Token
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // 5. 保存 Refresh Token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  /**
   * 用户登录
   */
  async login(data: LoginData): Promise<{ user: User; token: string; refreshToken?: string }> {
    const { email, password, rememberMe } = data;

    console.log(`🔑 登录请求: ${email}`);

    // 1. 查找用户
    const query = `
      SELECT id, username, email, password_hash, display_name, role, subscription_type, status, 
             failed_login_attempts, locked_until
      FROM ${AUTH_TABLES.USERS}
      WHERE email = $1
    `;

    const result = await this.pool.query(query, [email]);

    if (result.rows.length === 0) {
      console.log(`❌ 用户不存在: ${email}`);
      throw new Error('邮箱或密码错误');
    }

    const user = result.rows[0];

    // 2. 检查账户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用');
    }

    // 3. 检查是否被锁定
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('账户已被锁定，请稍后再试');
    }

    // 4. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`❌ 密码错误: ${email}`);
      await this.incrementFailedAttempts(user.id);
      throw new Error('邮箱或密码错误');
    }

    console.log(`✅ 登录成功: ${email}`);

    // 5. 重置失败次数
    await this.resetFailedAttempts(user.id);

    // 6. 生成 Token
    const token = this.generateToken(user);
    const refreshToken = rememberMe ? this.generateRefreshToken(user) : undefined;

    // 7. 保存 Refresh Token（如果需要）
    if (refreshToken) {
      await this.saveRefreshToken(user.id, refreshToken);
    }

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  /**
   * 检查用户是否存在
   */
  private async checkUserExists(email: string, username: string): Promise<any | null> {
    const query = `
      SELECT id, email, username 
      FROM ${AUTH_TABLES.USERS}
      WHERE email = $1 OR username = $2
      LIMIT 1
    `;

    console.log(`🔍 检查用户是否存在: ${email} / ${username}`);
    console.log(`📋 查询表: ${AUTH_TABLES.USERS}`);

    const result = await this.pool.query(query, [email, username]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 生成访问令牌
   */
  private generateToken(user: any): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscriptionType: user.subscription_type
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as SignOptions);
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(user: any): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtRefreshExpiresIn
    } as SignOptions);
  }

  /**
   * 保存刷新令牌
   */
  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    const query = `
      INSERT INTO ${AUTH_TABLES.REFRESH_TOKENS} 
        (user_id, token, expires_at, created_at, revoked)
      VALUES 
        ($1, $2, $3, NOW(), false)
    `;

    await this.pool.query(query, [userId, token, expiresAt]);
  }

  /**
   * 增加失败登录次数
   */
  private async incrementFailedAttempts(userId: number): Promise<void> {
    const query = `
      UPDATE ${AUTH_TABLES.USERS}
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
            ELSE locked_until
          END
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * 重置失败登录次数
   */
  private async resetFailedAttempts(userId: number): Promise<void> {
    const query = `
      UPDATE ${AUTH_TABLES.USERS}
      SET failed_login_attempts = 0,
          locked_until = NULL,
          last_login = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * 清理用户敏感信息
   */
  private sanitizeUser(user: any): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      subscriptionType: user.subscription_type,
      createdAt: user.created_at
    };
  }

  /**
   * 验证令牌
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('无效的令牌');
    }
  }
}

