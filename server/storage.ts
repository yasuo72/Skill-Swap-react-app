import {
  users,
  skills,
  userSkillsOffered,
  userSkillsWanted,
  swapRequests,
  feedback,
  messages,
  type User,
  type UpsertUser,
  type Skill,
  type UserSkillOffered,
  type UserSkillWanted,
  type SwapRequest,
  type Feedback,
  type Message,
  type InsertSkill,
  type InsertUserSkillOffered,
  type InsertUserSkillWanted,
  type InsertSwapRequest,
  type InsertFeedback,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Skill operations
  getAllSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  searchSkills(query: string): Promise<Skill[]>;
  
  // User skills operations
  getUserSkillsOffered(userId: string): Promise<(UserSkillOffered & { skill: Skill })[]>;
  getUserSkillsWanted(userId: string): Promise<(UserSkillWanted & { skill: Skill })[]>;
  addUserSkillOffered(userSkill: InsertUserSkillOffered): Promise<UserSkillOffered>;
  addUserSkillWanted(userSkill: InsertUserSkillWanted): Promise<UserSkillWanted>;
  removeUserSkillOffered(id: number): Promise<void>;
  removeUserSkillWanted(id: number): Promise<void>;
  
  // Browse users
  browseUsers(filters?: { 
    skillQuery?: string; 
    availability?: string[]; 
    location?: string; 
    limit?: number; 
    offset?: number; 
  }): Promise<(User & { 
    skillsOffered: (UserSkillOffered & { skill: Skill })[]; 
    skillsWanted: (UserSkillWanted & { skill: Skill })[]; 
    averageRating?: number;
    totalSwaps?: number;
  })[]>;
  
  // Swap requests
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  getSwapRequestsForUser(userId: string, status?: string): Promise<(SwapRequest & {
    requester: User;
    receiver: User;
    offeredSkill: Skill;
    requestedSkill: Skill;
  })[]>;
  updateSwapRequestStatus(id: number, status: string): Promise<SwapRequest>;
  
  // Feedback
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getUserFeedback(userId: string): Promise<(Feedback & { reviewer: User })[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getSwapRequestMessages(swapRequestId: number): Promise<(Message & { sender: User })[]>;
  
  // Admin operations
  getAllUsers(limit?: number, offset?: number): Promise<(User & { 
    totalSwaps: number; 
    averageRating: number; 
  })[]>;
  updateUserStatus(userId: string, isAdmin?: boolean): Promise<User>;
  getFlaggedContent(): Promise<any[]>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalSwaps: number;
    averageRating: number;
    flaggedContent: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(skills.name);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async searchSkills(query: string): Promise<Skill[]> {
    return await db.select().from(skills).where(ilike(skills.name, `%${query}%`));
  }

  async getUserSkillsOffered(userId: string): Promise<(UserSkillOffered & { skill: Skill })[]> {
    return await db
      .select({
        id: userSkillsOffered.id,
        userId: userSkillsOffered.userId,
        skillId: userSkillsOffered.skillId,
        proficiencyLevel: userSkillsOffered.proficiencyLevel,
        createdAt: userSkillsOffered.createdAt,
        skill: skills,
      })
      .from(userSkillsOffered)
      .innerJoin(skills, eq(userSkillsOffered.skillId, skills.id))
      .where(eq(userSkillsOffered.userId, userId));
  }

  async getUserSkillsWanted(userId: string): Promise<(UserSkillWanted & { skill: Skill })[]> {
    return await db
      .select({
        id: userSkillsWanted.id,
        userId: userSkillsWanted.userId,
        skillId: userSkillsWanted.skillId,
        urgency: userSkillsWanted.urgency,
        createdAt: userSkillsWanted.createdAt,
        skill: skills,
      })
      .from(userSkillsWanted)
      .innerJoin(skills, eq(userSkillsWanted.skillId, skills.id))
      .where(eq(userSkillsWanted.userId, userId));
  }

  async addUserSkillOffered(userSkill: InsertUserSkillOffered): Promise<UserSkillOffered> {
    const [newUserSkill] = await db.insert(userSkillsOffered).values(userSkill).returning();
    return newUserSkill;
  }

  async addUserSkillWanted(userSkill: InsertUserSkillWanted): Promise<UserSkillWanted> {
    const [newUserSkill] = await db.insert(userSkillsWanted).values(userSkill).returning();
    return newUserSkill;
  }

  async removeUserSkillOffered(id: number): Promise<void> {
    await db.delete(userSkillsOffered).where(eq(userSkillsOffered.id, id));
  }

  async removeUserSkillWanted(id: number): Promise<void> {
    await db.delete(userSkillsWanted).where(eq(userSkillsWanted.id, id));
  }

  async browseUsers(filters?: { 
    skillQuery?: string; 
    availability?: string[]; 
    location?: string; 
    limit?: number; 
    offset?: number; 
  }): Promise<(User & { 
    skillsOffered: (UserSkillOffered & { skill: Skill })[]; 
    skillsWanted: (UserSkillWanted & { skill: Skill })[]; 
    averageRating?: number;
    totalSwaps?: number;
  })[]> {
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    
    let query = db.select().from(users).where(eq(users.isPublic, true));
    
    if (filters?.location) {
      query = query.where(ilike(users.location, `%${filters.location}%`));
    }
    
    const usersList = await query.limit(limit).offset(offset);
    
    const usersWithSkills = await Promise.all(
      usersList.map(async (user) => {
        const skillsOffered = await this.getUserSkillsOffered(user.id);
        const skillsWanted = await this.getUserSkillsWanted(user.id);
        
        const feedbackData = await db
          .select({ rating: feedback.rating })
          .from(feedback)
          .where(eq(feedback.revieweeId, user.id));
        
        const totalSwaps = await db
          .select({ count: sql<number>`count(*)` })
          .from(swapRequests)
          .where(
            and(
              or(eq(swapRequests.requesterId, user.id), eq(swapRequests.receiverId, user.id)),
              eq(swapRequests.status, "completed")
            )
          );
        
        const averageRating = feedbackData.length > 0 
          ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length 
          : undefined;
        
        return {
          ...user,
          skillsOffered,
          skillsWanted,
          averageRating,
          totalSwaps: totalSwaps[0]?.count || 0,
        };
      })
    );
    
    return usersWithSkills;
  }

  async createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const [newSwapRequest] = await db.insert(swapRequests).values(swapRequest).returning();
    return newSwapRequest;
  }

  async getSwapRequestsForUser(userId: string, status?: string): Promise<(SwapRequest & {
    requester: User;
    receiver: User;
    offeredSkill: Skill;
    requestedSkill: Skill;
  })[]> {
    let query = db
      .select({
        id: swapRequests.id,
        requesterId: swapRequests.requesterId,
        receiverId: swapRequests.receiverId,
        offeredSkillId: swapRequests.offeredSkillId,
        requestedSkillId: swapRequests.requestedSkillId,
        message: swapRequests.message,
        status: swapRequests.status,
        preferredTime: swapRequests.preferredTime,
        createdAt: swapRequests.createdAt,
        updatedAt: swapRequests.updatedAt,
        requester: users,
        receiver: {
          id: sql`receiver.id`,
          email: sql`receiver.email`,
          firstName: sql`receiver.first_name`,
          lastName: sql`receiver.last_name`,
          profileImageUrl: sql`receiver.profile_image_url`,
          title: sql`receiver.title`,
          location: sql`receiver.location`,
          isPublic: sql`receiver.is_public`,
          availability: sql`receiver.availability`,
          isAdmin: sql`receiver.is_admin`,
          createdAt: sql`receiver.created_at`,
          updatedAt: sql`receiver.updated_at`,
        },
        offeredSkill: {
          id: sql`offered_skill.id`,
          name: sql`offered_skill.name`,
          category: sql`offered_skill.category`,
          icon: sql`offered_skill.icon`,
          createdAt: sql`offered_skill.created_at`,
        },
        requestedSkill: {
          id: sql`requested_skill.id`,
          name: sql`requested_skill.name`,
          category: sql`requested_skill.category`,
          icon: sql`requested_skill.icon`,
          createdAt: sql`requested_skill.created_at`,
        },
      })
      .from(swapRequests)
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .innerJoin(sql`users as receiver`, sql`swap_requests.receiver_id = receiver.id`)
      .innerJoin(sql`skills as offered_skill`, sql`swap_requests.offered_skill_id = offered_skill.id`)
      .innerJoin(sql`skills as requested_skill`, sql`swap_requests.requested_skill_id = requested_skill.id`)
      .where(or(eq(swapRequests.requesterId, userId), eq(swapRequests.receiverId, userId)));
    
    if (status) {
      query = query.where(eq(swapRequests.status, status));
    }
    
    return await query.orderBy(desc(swapRequests.createdAt));
  }

  async updateSwapRequestStatus(id: number, status: string): Promise<SwapRequest> {
    const [updatedSwapRequest] = await db
      .update(swapRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(swapRequests.id, id))
      .returning();
    return updatedSwapRequest;
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async getUserFeedback(userId: string): Promise<(Feedback & { reviewer: User })[]> {
    return await db
      .select({
        id: feedback.id,
        swapRequestId: feedback.swapRequestId,
        reviewerId: feedback.reviewerId,
        revieweeId: feedback.revieweeId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        reviewer: users,
      })
      .from(feedback)
      .innerJoin(users, eq(feedback.reviewerId, users.id))
      .where(eq(feedback.revieweeId, userId))
      .orderBy(desc(feedback.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getSwapRequestMessages(swapRequestId: number): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        swapRequestId: messages.swapRequestId,
        senderId: messages.senderId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.swapRequestId, swapRequestId))
      .orderBy(messages.createdAt);
  }

  async getAllUsers(limit?: number, offset?: number): Promise<(User & { 
    totalSwaps: number; 
    averageRating: number; 
  })[]> {
    const usersList = await db.select().from(users)
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(users.createdAt));
    
    const usersWithStats = await Promise.all(
      usersList.map(async (user) => {
        const totalSwapsResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(swapRequests)
          .where(
            and(
              or(eq(swapRequests.requesterId, user.id), eq(swapRequests.receiverId, user.id)),
              eq(swapRequests.status, "completed")
            )
          );
        
        const feedbackData = await db
          .select({ rating: feedback.rating })
          .from(feedback)
          .where(eq(feedback.revieweeId, user.id));
        
        const averageRating = feedbackData.length > 0 
          ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length 
          : 0;
        
        return {
          ...user,
          totalSwaps: totalSwapsResult[0]?.count || 0,
          averageRating,
        };
      })
    );
    
    return usersWithStats;
  }

  async updateUserStatus(userId: string, isAdmin?: boolean): Promise<User> {
    const updateData: Partial<User> = { updatedAt: new Date() };
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getFlaggedContent(): Promise<any[]> {
    // For now, return empty array. In a real implementation, this would check for flagged content
    return [];
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalSwaps: number;
    averageRating: number;
    flaggedContent: number;
  }> {
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalSwapsResult = await db.select({ count: sql<number>`count(*)` }).from(swapRequests);
    const avgRatingResult = await db.select({ avg: sql<number>`avg(rating)` }).from(feedback);
    
    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalSwaps: totalSwapsResult[0]?.count || 0,
      averageRating: avgRatingResult[0]?.avg || 0,
      flaggedContent: 0, // Placeholder
    };
  }
}

export const storage = new DatabaseStorage();
