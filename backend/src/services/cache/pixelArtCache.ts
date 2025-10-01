// Pixel Art Cache Service
// 像素画缓存服务 - 用于缓存像素画相关数据

export interface CacheOptions {
  ttl?: number // 生存时间（秒）
  maxSize?: number // 最大缓存大小
}

export class PixelArtCacheService {
  private cache = new Map<string, any>()
  private timestamps = new Map<string, number>()
  private readonly defaultTTL = 3600 // 1小时

  // 设置缓存
  set(key: string, value: any, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL
    const timestamp = Date.now()
    
    this.cache.set(key, value)
    this.timestamps.set(key, timestamp)
    
    // 设置过期时间
    setTimeout(() => {
      this.delete(key)
    }, ttl * 1000)
  }

  // 获取缓存
  get(key: string): any | null {
    if (!this.cache.has(key)) {
      return null
    }
    
    const timestamp = this.timestamps.get(key)
    if (!timestamp) {
      this.delete(key)
      return null
    }
    
    return this.cache.get(key)
  }

  // 删除缓存
  delete(key: string): boolean {
    this.timestamps.delete(key)
    return this.cache.delete(key)
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    this.timestamps.clear()
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    return this.cache.has(key)
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size
  }

  // 生成缓存键
  generateKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.join(':')}`
  }
}

// 导出单例实例
export const pixelArtCache = new PixelArtCacheService()
