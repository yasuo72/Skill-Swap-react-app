import nodemailer from 'nodemailer';
import { User, SwapRequest, Skill } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
    } else {
      console.warn('Email service not configured. Set SMTP_* environment variables.');
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.isConfigured) {
      console.log('Email would be sent:', { to, subject });
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"SkillSwap Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private getBaseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SkillSwap Platform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SkillSwap Platform</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This email was sent from SkillSwap Platform. If you didn't expect this email, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Welcome email for new users
  async sendWelcomeEmail(user: User) {
    const content = `
      <h2>Welcome to SkillSwap, ${user.firstName || user.username}!</h2>
      <p>Thank you for joining our skill-sharing community. Here's what you can do next:</p>
      <ul>
        <li>Complete your profile with skills you can offer</li>
        <li>Add skills you'd like to learn</li>
        <li>Browse other users and start skill swapping</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/profile" class="button">Complete Your Profile</a>
      <p>Happy skill swapping!</p>
    `;

    await this.sendEmail(
      user.email!,
      'Welcome to SkillSwap Platform!',
      this.getBaseTemplate(content)
    );
  }

  // New swap request notification
  async sendSwapRequestNotification(
    receiver: User,
    requester: User,
    offeredSkill: Skill,
    requestedSkill: Skill,
    message?: string
  ) {
    const content = `
      <h2>New Skill Swap Request!</h2>
      <p><strong>${requester.firstName || requester.username}</strong> wants to swap skills with you:</p>
      <div style="background: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0;">
        <p><strong>They're offering:</strong> ${offeredSkill.name}</p>
        <p><strong>They want to learn:</strong> ${requestedSkill.name}</p>
        ${message ? `<p><strong>Message:</strong> "${message}"</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/swaps" class="button">View Request</a>
    `;

    await this.sendEmail(
      receiver.email!,
      `New skill swap request from ${requester.firstName || requester.username}`,
      this.getBaseTemplate(content)
    );
  }

  // Swap request status update
  async sendSwapStatusUpdate(
    user: User,
    otherUser: User,
    status: string,
    offeredSkill: Skill,
    requestedSkill: Skill
  ) {
    let statusMessage = '';
    let subject = '';

    switch (status) {
      case 'accepted':
        statusMessage = `Great news! ${otherUser.firstName || otherUser.username} has accepted your skill swap request.`;
        subject = 'Your skill swap request was accepted!';
        break;
      case 'declined':
        statusMessage = `${otherUser.firstName || otherUser.username} has declined your skill swap request. Don't worry, there are many other opportunities!`;
        subject = 'Skill swap request update';
        break;
      case 'completed':
        statusMessage = `Your skill swap with ${otherUser.firstName || otherUser.username} has been marked as completed. Don't forget to leave feedback!`;
        subject = 'Skill swap completed!';
        break;
    }

    const content = `
      <h2>Skill Swap Update</h2>
      <p>${statusMessage}</p>
      <div style="background: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0;">
        <p><strong>Skill offered:</strong> ${offeredSkill.name}</p>
        <p><strong>Skill requested:</strong> ${requestedSkill.name}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/swaps" class="button">View Details</a>
    `;

    await this.sendEmail(user.email!, subject, this.getBaseTemplate(content));
  }

  // New message notification
  async sendMessageNotification(
    receiver: User,
    sender: User,
    messageContent: string,
    swapRequestId: number
  ) {
    const content = `
      <h2>New Message</h2>
      <p><strong>${sender.firstName || sender.username}</strong> sent you a message:</p>
      <div style="background: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0;">
        <p>"${messageContent}"</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/swaps/${swapRequestId}" class="button">Reply</a>
    `;

    await this.sendEmail(
      receiver.email!,
      `New message from ${sender.firstName || sender.username}`,
      this.getBaseTemplate(content)
    );
  }

  // Feedback reminder
  async sendFeedbackReminder(user: User, otherUser: User, swapRequestId: number) {
    const content = `
      <h2>Don't Forget to Leave Feedback!</h2>
      <p>You recently completed a skill swap with <strong>${otherUser.firstName || otherUser.username}</strong>.</p>
      <p>Your feedback helps build trust in our community and helps other users make informed decisions.</p>
      <a href="${process.env.FRONTEND_URL}/swaps/${swapRequestId}/feedback" class="button">Leave Feedback</a>
    `;

    await this.sendEmail(
      user.email!,
      'Please leave feedback for your recent skill swap',
      this.getBaseTemplate(content)
    );
  }

  // Weekly digest email
  async sendWeeklyDigest(user: User, stats: {
    newSwapRequests: number;
    completedSwaps: number;
    newSkills: number;
    suggestedUsers: User[];
  }) {
    const content = `
      <h2>Your Weekly SkillSwap Digest</h2>
      <p>Hi ${user.firstName || user.username}, here's what happened this week:</p>
      
      <div style="background: white; padding: 15px; margin: 15px 0;">
        <h3>Your Activity</h3>
        <ul>
          <li>${stats.newSwapRequests} new swap requests</li>
          <li>${stats.completedSwaps} completed swaps</li>
          <li>${stats.newSkills} new skills added to the platform</li>
        </ul>
      </div>

      ${stats.suggestedUsers.length > 0 ? `
        <div style="background: white; padding: 15px; margin: 15px 0;">
          <h3>Users You Might Want to Connect With</h3>
          ${stats.suggestedUsers.map(u => `
            <p><strong>${u.firstName || u.username}</strong> - ${u.title || 'Skill swapper'}</p>
          `).join('')}
        </div>
      ` : ''}

      <a href="${process.env.FRONTEND_URL}/browse" class="button">Explore More Skills</a>
    `;

    await this.sendEmail(
      user.email!,
      'Your weekly SkillSwap digest',
      this.getBaseTemplate(content)
    );
  }

  // Test email configuration
  async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
