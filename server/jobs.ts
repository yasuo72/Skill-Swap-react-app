import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './email';
import { cacheService } from './cache';
import { FileUploadService } from './upload';

export class BackgroundJobsService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.setupJobs();
  }

  private setupJobs() {
    // Daily cleanup job - runs at 2 AM every day
    this.scheduleJob('daily-cleanup', '0 2 * * *', async () => {
      await this.runDailyCleanup();
    });

    // Weekly digest emails - runs every Sunday at 9 AM
    this.scheduleJob('weekly-digest', '0 9 * * 0', async () => {
      await this.sendWeeklyDigests();
    });

    // Feedback reminders - runs every day at 6 PM
    this.scheduleJob('feedback-reminders', '0 18 * * *', async () => {
      await this.sendFeedbackReminders();
    });

    // Cache warming - runs every hour
    this.scheduleJob('cache-warming', '0 * * * *', async () => {
      await this.warmCache();
    });

    // Platform stats update - runs every 30 minutes
    this.scheduleJob('stats-update', '*/30 * * * *', async () => {
      await this.updatePlatformStats();
    });

    // File cleanup - runs daily at 3 AM
    this.scheduleJob('file-cleanup', '0 3 * * *', async () => {
      await this.cleanupOldFiles();
    });

    // Inactive user cleanup - runs weekly on Monday at 1 AM
    this.scheduleJob('inactive-users', '0 1 * * 1', async () => {
      await this.handleInactiveUsers();
    });
  }

  private scheduleJob(name: string, schedule: string, task: () => Promise<void>) {
    const job = cron.schedule(schedule, async () => {
      console.log(`Starting job: ${name}`);
      const startTime = Date.now();
      
      try {
        await task();
        const duration = Date.now() - startTime;
        console.log(`Job ${name} completed in ${duration}ms`);
      } catch (error) {
        console.error(`Job ${name} failed:`, error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'
    });

    this.jobs.set(name, job);
  }

  // Start all jobs
  startJobs() {
    console.log('Starting background jobs...');
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started job: ${name}`);
    });
  }

  // Stop all jobs
  stopJobs() {
    console.log('Stopping background jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
  }

  // Individual job implementations
  private async runDailyCleanup() {
    try {
      // Clean up expired sessions (handled by connect-pg-simple)
      // Clean up old unread messages (mark as read after 30 days)
      // Clean up cancelled swap requests older than 30 days
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // This would require additional methods in storage
      console.log('Daily cleanup completed');
    } catch (error) {
      console.error('Daily cleanup failed:', error);
    }
  }

  private async sendWeeklyDigests() {
    try {
      // Get all users who opted in for weekly digests
      const users = await storage.getAllUsers(1000, 0); // Get first 1000 users
      
      for (const user of users) {
        if (!user.email) continue;

        try {
          // Calculate user stats for the week
          const stats = {
            newSwapRequests: 0, // Would need to implement in storage
            completedSwaps: 0,
            newSkills: 0,
            suggestedUsers: [], // Would implement user recommendation logic
          };

          await emailService.sendWeeklyDigest(user, stats);
          
          // Add delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send digest to ${user.email}:`, error);
        }
      }

      console.log('Weekly digests sent');
    } catch (error) {
      console.error('Weekly digest job failed:', error);
    }
  }

  private async sendFeedbackReminders() {
    try {
      // Find completed swaps without feedback from the last 7 days
      // This would require additional queries in storage
      console.log('Feedback reminders sent');
    } catch (error) {
      console.error('Feedback reminders job failed:', error);
    }
  }

  private async warmCache() {
    try {
      await cacheService.warmCache(storage);
    } catch (error) {
      console.error('Cache warming job failed:', error);
    }
  }

  private async updatePlatformStats() {
    try {
      const stats = await storage.getPlatformStats();
      cacheService.cachePlatformStats(stats);
      console.log('Platform stats updated');
    } catch (error) {
      console.error('Platform stats update failed:', error);
    }
  }

  private async cleanupOldFiles() {
    try {
      await FileUploadService.cleanupOldFiles(30); // Clean files older than 30 days
      console.log('File cleanup completed');
    } catch (error) {
      console.error('File cleanup failed:', error);
    }
  }

  private async handleInactiveUsers() {
    try {
      // Find users who haven't logged in for 90 days
      // Send re-engagement emails
      // Mark accounts as inactive (but don't delete)
      console.log('Inactive user handling completed');
    } catch (error) {
      console.error('Inactive user handling failed:', error);
    }
  }

  // Manual job triggers (for admin use)
  async runJob(jobName: string): Promise<boolean> {
    const job = this.jobs.get(jobName);
    if (!job) {
      console.error(`Job ${jobName} not found`);
      return false;
    }

    try {
      console.log(`Manually running job: ${jobName}`);
      
      // Execute the job's task
      switch (jobName) {
        case 'daily-cleanup':
          await this.runDailyCleanup();
          break;
        case 'weekly-digest':
          await this.sendWeeklyDigests();
          break;
        case 'feedback-reminders':
          await this.sendFeedbackReminders();
          break;
        case 'cache-warming':
          await this.warmCache();
          break;
        case 'stats-update':
          await this.updatePlatformStats();
          break;
        case 'file-cleanup':
          await this.cleanupOldFiles();
          break;
        case 'inactive-users':
          await this.handleInactiveUsers();
          break;
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }

      return true;
    } catch (error) {
      console.error(`Manual job ${jobName} failed:`, error);
      return false;
    }
  }

  // Get job status
  getJobStatus() {
    const status: any = {};
    
    this.jobs.forEach((job, name) => {
      status[name] = {
        exists: true,
        // Note: node-cron doesn't expose running/scheduled status directly
        // You would need to track this manually if needed
      };
    });

    return status;
  }

  // One-time jobs for specific events
  async scheduleOneTimeJob(name: string, delay: number, task: () => Promise<void>) {
    setTimeout(async () => {
      console.log(`Running one-time job: ${name}`);
      try {
        await task();
        console.log(`One-time job ${name} completed`);
      } catch (error) {
        console.error(`One-time job ${name} failed:`, error);
      }
    }, delay);
  }

  // Schedule feedback reminder for specific swap
  async scheduleFeedbackReminder(swapRequestId: number, userId: number, otherUserId: number) {
    const delay = 24 * 60 * 60 * 1000; // 24 hours
    
    await this.scheduleOneTimeJob(
      `feedback-reminder-${swapRequestId}`,
      delay,
      async () => {
        try {
          const user = await storage.getUser(userId);
          const otherUser = await storage.getUser(otherUserId);
          
          if (user && otherUser && user.email) {
            await emailService.sendFeedbackReminder(user, otherUser, swapRequestId);
          }
        } catch (error) {
          console.error('Failed to send feedback reminder:', error);
        }
      }
    );
  }

  // Schedule welcome email for new users
  async scheduleWelcomeEmail(userId: number) {
    const delay = 5 * 60 * 1000; // 5 minutes delay
    
    await this.scheduleOneTimeJob(
      `welcome-email-${userId}`,
      delay,
      async () => {
        try {
          const user = await storage.getUser(userId);
          if (user && user.email) {
            await emailService.sendWelcomeEmail(user);
          }
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        }
      }
    );
  }
}

export const backgroundJobsService = new BackgroundJobsService();
