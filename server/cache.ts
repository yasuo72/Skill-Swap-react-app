import NodeCache from 'node-cache';
import { User, Skill } from '@shared/schema';

// Cache configurations
const DEFAULT_TTL = 300; // 5 minutes
const LONG_TTL = 3600; // 1 hour
const SHORT_TTL = 60; // 1 minute

export class CacheService {
  private cache: NodeCache;
  private statsCache: NodeCache;
  private userCache: NodeCache;

  constructor() {
    // Main cache for general data
    this.cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance, but be careful with object mutations
    });

    // Separate cache for statistics (longer TTL)
    this.statsCache = new NodeCache({
      stdTTL: LONG_TTL,
      checkperiod: 300,
      useClones: false,
    });

    // User-specific cache (shorter TTL for privacy)
    this.userCache = new NodeCache({
      stdTTL: SHORT_TTL,
      checkperiod: 60,
      useClones: false,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Log cache events in development
    if (process.env.NODE_ENV === 'development') {
      this.cache.on('set', (key, value) => {
        console.log(`Cache SET: ${key}`);
      });

      this.cache.on('expired', (key, value) => {
        console.log(`Cache EXPIRED: ${key}`);
      });
    }
  }

  // Generic cache methods
  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || DEFAULT_TTL);
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    this.statsCache.flushAll();
    this.userCache.flushAll();
  }

  // Skills caching
  cacheSkills(skills: Skill[]): void {
    this.set('all_skills', skills, LONG_TTL);
  }

  getCachedSkills(): Skill[] | undefined {
    return this.get<Skill[]>('all_skills');
  }

  cacheSkillSearch(query: string, results: Skill[]): void {
    const key = `skill_search:${query.toLowerCase()}`;
    this.set(key, results, DEFAULT_TTL);
  }

  getCachedSkillSearch(query: string): Skill[] | undefined {
    const key = `skill_search:${query.toLowerCase()}`;
    return this.get<Skill[]>(key);
  }

  invalidateSkillsCache(): void {
    this.del('all_skills');
    // Clear all skill search caches
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith('skill_search:')) {
        this.del(key);
      }
    });
  }

  // User caching
  cacheUser(user: User): void {
    const key = `user:${user.id}`;
    this.userCache.set(key, user, SHORT_TTL);
  }

  getCachedUser(userId: number): User | undefined {
    const key = `user:${userId}`;
    return this.userCache.get<User>(key);
  }

  invalidateUserCache(userId: number): void {
    const key = `user:${userId}`;
    this.userCache.del(key);
  }

  // User skills caching
  cacheUserSkills(userId: number, type: 'offered' | 'wanted', skills: any[]): void {
    const key = `user_skills:${userId}:${type}`;
    this.set(key, skills, DEFAULT_TTL);
  }

  getCachedUserSkills(userId: number, type: 'offered' | 'wanted'): any[] | undefined {
    const key = `user_skills:${userId}:${type}`;
    return this.get<any[]>(key);
  }

  invalidateUserSkillsCache(userId: number): void {
    this.del(`user_skills:${userId}:offered`);
    this.del(`user_skills:${userId}:wanted`);
  }

  // Browse users caching
  cacheBrowseResults(filters: any, results: any[]): void {
    const key = `browse:${JSON.stringify(filters)}`;
    this.set(key, results, DEFAULT_TTL);
  }

  getCachedBrowseResults(filters: any): any[] | undefined {
    const key = `browse:${JSON.stringify(filters)}`;
    return this.get<any[]>(key);
  }

  invalidateBrowseCache(): void {
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith('browse:')) {
        this.del(key);
      }
    });
  }

  // Swap requests caching
  cacheUserSwapRequests(userId: number, status: string | undefined, requests: any[]): void {
    const key = `swap_requests:${userId}:${status || 'all'}`;
    this.set(key, requests, SHORT_TTL);
  }

  getCachedUserSwapRequests(userId: number, status?: string): any[] | undefined {
    const key = `swap_requests:${userId}:${status || 'all'}`;
    return this.get<any[]>(key);
  }

  invalidateUserSwapRequestsCache(userId: number): void {
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith(`swap_requests:${userId}:`)) {
        this.del(key);
      }
    });
  }

  // Statistics caching
  cachePlatformStats(stats: any): void {
    this.statsCache.set('platform_stats', stats, LONG_TTL);
  }

  getCachedPlatformStats(): any | undefined {
    return this.statsCache.get('platform_stats');
  }

  invalidatePlatformStatsCache(): void {
    this.statsCache.del('platform_stats');
  }

  // Feedback caching
  cacheUserFeedback(userId: string, feedback: any[]): void {
    const key = `user_feedback:${userId}`;
    this.set(key, feedback, DEFAULT_TTL);
  }

  getCachedUserFeedback(userId: string): any[] | undefined {
    const key = `user_feedback:${userId}`;
    return this.get<any[]>(key);
  }

  invalidateUserFeedbackCache(userId: string): void {
    const key = `user_feedback:${userId}`;
    this.del(key);
  }

  // Messages caching
  cacheSwapMessages(swapRequestId: number, messages: any[]): void {
    const key = `swap_messages:${swapRequestId}`;
    this.set(key, messages, SHORT_TTL);
  }

  getCachedSwapMessages(swapRequestId: number): any[] | undefined {
    const key = `swap_messages:${swapRequestId}`;
    return this.get<any[]>(key);
  }

  invalidateSwapMessagesCache(swapRequestId: number): void {
    const key = `swap_messages:${swapRequestId}`;
    this.del(key);
  }

  // Cache statistics
  getStats() {
    return {
      main: this.cache.getStats(),
      stats: this.statsCache.getStats(),
      user: this.userCache.getStats(),
    };
  }

  // Cache warming methods
  async warmCache(storage: any): Promise<void> {
    try {
      console.log('Warming cache...');
      
      // Warm skills cache
      const skills = await storage.getAllSkills();
      this.cacheSkills(skills);
      
      // Warm platform stats cache
      const stats = await storage.getPlatformStats();
      this.cachePlatformStats(stats);
      
      console.log('Cache warmed successfully');
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  // Middleware for automatic caching
  cacheMiddleware(ttl: number = DEFAULT_TTL) {
    return (req: any, res: any, next: any) => {
      const key = `route:${req.method}:${req.originalUrl}`;
      const cached = this.get(key);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (body: any) => {
        if (res.statusCode === 200) {
          this.set(key, body, ttl);
        }
        return originalJson.call(res, body);
      };
      
      next();
    };
  }

  // Cache invalidation patterns
  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.del(key);
      }
    });
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    return {
      main: {
        keys: this.cache.keys().length,
        memory: JSON.stringify(this.cache.keys()).length,
      },
      stats: {
        keys: this.statsCache.keys().length,
        memory: JSON.stringify(this.statsCache.keys()).length,
      },
      user: {
        keys: this.userCache.keys().length,
        memory: JSON.stringify(this.userCache.keys()).length,
      },
    };
  }
}

export const cacheService = new CacheService();
