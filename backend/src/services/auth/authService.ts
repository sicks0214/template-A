/**
 * 用户认证服务
 */

import { 
  User, 
  CreateUserRequest, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  ChangePasswordRequest,
  UserSession,
  UserAnalysisHistory,
  UserFavoritePalette,
  PaginationParams,
  PaginatedResponse
} from '../../types/auth';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  generateSecureToken,
  hashToken,
  validatePasswordStrength,
  validateEmail,
  validateUsername
} from '../../middleware/auth';
import { PostgreSQLService } from '../database/postgresService';

export class AuthService {
  constructor(private db: PostgreSQLService) {}

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    // 验证输入数据
    if (!validateEmail(data.email)) {
      throw new Error('邮箱格式不正确');
    }

    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.errors[0]);
    }

    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

    if (data.password !== data.confirm_password) {
      throw new Error('两次输入的密码不一致');
    }

    if (!data.agree_to_terms) {
      throw new Error('必须同意服务条款');
    }

    // 检查邮箱和用户名是否已存在
    const existingUser = await this.checkUserExists(data.email, data.username);
    if (existingUser.emailExists) {
      throw new Error('该邮箱已被注册');
    }
    if (existingUser.usernameExists) {
      throw new Error('该用户名已被使用');
    }

    // 创建用户
    const passwordHash = await hashPassword(data.password);
    const emailVerificationToken = generateSecureToken();

    const userData: CreateUserRequest = {
      email: data.email,
      username: data.username,
      password: passwordHash,
      display_name: data.display_name || data.username
    };

    const user = await this.createUser(userData, emailVerificationToken);

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      subscription_type: user.subscription_type
    });

    // TODO: 发送邮箱验证邮件
    // await this.sendEmailVerification(user.email, emailVerificationToken);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest, clientInfo: any): Promise<{ 
    user: Omit<User, 'password_hash'>; 
    token: string; 
    refresh_token?: string 
  }> {
    if (!validateEmail(data.email)) {
      throw new Error('邮箱格式不正确');
    }

    // 获取用户信息
    const user = await this.getUserByEmail(data.email);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 检查账户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用，请联系客服');
    }

    // 检查账户是否被锁定
    if (user.locked_until && new Date() < user.locked_until) {
      const unlockTime = user.locked_until.toLocaleString();
      throw new Error(`账户已被锁定，解锁时间：${unlockTime}`);
    }

    // 验证密码
    const isValidPassword = await verifyPassword(data.password, user.password_hash);
    if (!isValidPassword) {
      // 增加失败登录次数
      await this.incrementFailedLoginAttempts(user.id);
      throw new Error('邮箱或密码错误');
    }

    // 重置失败登录次数
    await this.resetFailedLoginAttempts(user.id);

    // 更新登录信息
    await this.updateLoginInfo(user.id);

    // 生成tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      subscription_type: user.subscription_type
    });

    let refresh_token;
    if (data.remember_me) {
      refresh_token = generateRefreshToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        subscription_type: user.subscription_type
      });

      // 保存会话信息
      await this.createSession(user.id, token, refresh_token, clientInfo);
    }

    return {
      user: this.sanitizeUser(user),
      token,
      refresh_token
    };
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1 AND status = 'active'
    `;
    
    const result = await (this.db as any).pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * 获取用户信息（通过邮箱）
   */
  async getUserByEmail(email: string): Promise<(User & { password_hash: string; locked_until?: Date }) | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1
    `;
    
    const result = await (this.db as any).pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.display_name !== undefined) {
      updateFields.push(`display_name = $${paramCount++}`);
      values.push(data.display_name);
    }

    if (data.avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatar_url);
    }

    if (data.preferences !== undefined) {
      updateFields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(data.preferences));
    }

    if (updateFields.length === 0) {
      throw new Error('没有需要更新的字段');
    }

    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND status = 'active'
      RETURNING *
    `;

    const result = await (this.db as any).pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }

    return result.rows[0];
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证当前密码
    const userWithPassword = await this.getUserByEmail(user.email);
    if (!userWithPassword || !await verifyPassword(data.current_password, userWithPassword.password_hash)) {
      throw new Error('当前密码错误');
    }

    // 验证新密码
    const passwordValidation = validatePasswordStrength(data.new_password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

    if (data.new_password !== data.confirm_password) {
      throw new Error('两次输入的新密码不一致');
    }

    // 更新密码
    const newPasswordHash = await hashPassword(data.new_password);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await (this.db as any).pool.query(query, [newPasswordHash, userId]);

    // 使所有会话失效（强制重新登录）
    await this.invalidateAllUserSessions(userId);
  }

  /**
   * 保存分析历史
   */
  async saveAnalysisHistory(
    userId: string, 
    analysisData: {
      image_url?: string;
      image_hash?: string;
      analysis_result: any;
      analysis_type: 'basic' | 'advanced' | 'ai_powered';
      processing_time_ms?: number;
      tags?: string[];
    }
  ): Promise<UserAnalysisHistory> {
    const query = `
      INSERT INTO user_analysis_history 
      (user_id, image_url, image_hash, analysis_result, analysis_type, processing_time_ms, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      analysisData.image_url,
      analysisData.image_hash,
      JSON.stringify(analysisData.analysis_result),
      analysisData.analysis_type,
      analysisData.processing_time_ms,
      analysisData.tags || []
    ];

    const result = await (this.db as any).pool.query(query, values);
    
    // 更新用户统计
    await this.updateUserDailyStats(userId, analysisData.analysis_type);
    
    return result.rows[0];
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(
    userId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResponse<UserAnalysisHistory>> {
    const offset = (pagination.page - 1) * pagination.limit;
    
    const countQuery = `
      SELECT COUNT(*) FROM user_analysis_history 
      WHERE user_id = $1
    `;
    
    const dataQuery = `
      SELECT * FROM user_analysis_history 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      (this.db as any).pool.query(countQuery, [userId]),
      (this.db as any).pool.query(dataQuery, [userId, pagination.limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const total_pages = Math.ceil(total / pagination.limit);

    return {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        total_pages,
        has_next: pagination.page < total_pages,
        has_prev: pagination.page > 1
      }
    };
  }

  /**
   * 保存收藏调色板
   */
  async saveFavoritePalette(
    userId: string,
    paletteData: {
      palette_name: string;
      colors: any[];
      source_type?: 'manual' | 'extracted' | 'ai_generated';
      source_image_url?: string;
      tags?: string[];
      is_public?: boolean;
    }
  ): Promise<UserFavoritePalette> {
    const query = `
      INSERT INTO user_favorite_palettes 
      (user_id, palette_name, colors, source_type, source_image_url, tags, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      paletteData.palette_name,
      JSON.stringify(paletteData.colors),
      paletteData.source_type || 'manual',
      paletteData.source_image_url,
      paletteData.tags || [],
      paletteData.is_public || false
    ];

    const result = await (this.db as any).pool.query(query, values);
    return result.rows[0];
  }

  /**
   * 获取收藏调色板
   */
  async getFavoritePalettes(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<UserFavoritePalette>> {
    const offset = (pagination.page - 1) * pagination.limit;
    
    const countQuery = `
      SELECT COUNT(*) FROM user_favorite_palettes 
      WHERE user_id = $1
    `;
    
    const dataQuery = `
      SELECT * FROM user_favorite_palettes 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      (this.db as any).pool.query(countQuery, [userId]),
      (this.db as any).pool.query(dataQuery, [userId, pagination.limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const total_pages = Math.ceil(total / pagination.limit);

    return {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        total_pages,
        has_next: pagination.page < total_pages,
        has_prev: pagination.page > 1
      }
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 检查用户是否存在
   */
  private async checkUserExists(email: string, username: string): Promise<{
    emailExists: boolean;
    usernameExists: boolean;
  }> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE email = $1) as email_count,
        COUNT(*) FILTER (WHERE username = $2) as username_count
      FROM users
    `;

    const result = await (this.db as any).pool.query(query, [email, username]);
    const row = result.rows[0];

    return {
      emailExists: parseInt(row.email_count) > 0,
      usernameExists: parseInt(row.username_count) > 0
    };
  }

  /**
   * 创建用户
   */
  private async createUser(data: CreateUserRequest, emailVerificationToken: string): Promise<User> {
    const query = `
      INSERT INTO users 
      (email, username, password_hash, display_name, avatar_url, email_verification_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.email,
      data.username,
      data.password,
      data.display_name,
      data.avatar_url,
      emailVerificationToken
    ];

    const result = await (this.db as any).pool.query(query, values);
    return result.rows[0];
  }

  /**
   * 清理用户敏感信息
   */
  private sanitizeUser(user: any): Omit<User, 'password_hash'> {
    const { password_hash, email_verification_token, password_reset_token, ...sanitized } = user;
    return sanitized;
  }

  /**
   * 增加失败登录次数
   */
  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
          ELSE locked_until
        END
      WHERE id = $1
    `;

    await (this.db as any).pool.query(query, [userId]);
  }

  /**
   * 重置失败登录次数
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE id = $1
    `;

    await (this.db as any).pool.query(query, [userId]);
  }

  /**
   * 更新登录信息
   */
  private async updateLoginInfo(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET 
        last_login_at = CURRENT_TIMESTAMP,
        login_count = login_count + 1
      WHERE id = $1
    `;

    await (this.db as any).pool.query(query, [userId]);
  }

  /**
   * 创建会话
   */
  private async createSession(
    userId: string,
    token: string,
    refreshToken: string,
    clientInfo: any
  ): Promise<void> {
    const query = `
      INSERT INTO user_sessions 
      (user_id, token_hash, refresh_token_hash, expires_at, refresh_expires_at, ip_address, user_agent, device_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const tokenHash = hashToken(token);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

    const values = [
      userId,
      tokenHash,
      refreshTokenHash,
      expiresAt,
      refreshExpiresAt,
      clientInfo.ip_address,
      clientInfo.user_agent,
      JSON.stringify(clientInfo.device_info)
    ];

    await (this.db as any).pool.query(query, values);
  }

  /**
   * 使所有用户会话失效
   */
  private async invalidateAllUserSessions(userId: string): Promise<void> {
    const query = `
      UPDATE user_sessions 
      SET is_active = false
      WHERE user_id = $1
    `;

    await (this.db as any).pool.query(query, [userId]);
  }

  /**
   * 更新用户每日统计
   */
  private async updateUserDailyStats(userId: string, analysisType: string): Promise<void> {
    const query = `
      INSERT INTO user_usage_stats (user_id, date, analyses_count, ai_analyses_count)
      VALUES ($1, CURRENT_DATE, $2, $3)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        analyses_count = user_usage_stats.analyses_count + $2,
        ai_analyses_count = user_usage_stats.ai_analyses_count + $3
    `;

    const analysesCount = analysisType !== 'ai_powered' ? 1 : 0;
    const aiAnalysesCount = analysisType === 'ai_powered' ? 1 : 0;

    await (this.db as any).pool.query(query, [userId, analysesCount, aiAnalysesCount]);
  }
}
