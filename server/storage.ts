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
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations (custom auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUserStatus(id: number, isAdmin: boolean): Promise<User>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getPlatformStats(): Promise<any>;
  
  // Skill operations
  getAllSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  getSkillById(id: number): Promise<Skill | undefined>;
  searchSkills(query: string): Promise<Skill[]>;
  
  // User skills operations
  getUserSkillsOffered(userId: number): Promise<(UserSkillOffered & { skill: Skill })[]>;
  getUserSkillsWanted(userId: number): Promise<(UserSkillWanted & { skill: Skill })[]>;
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
  getSwapRequestsForUser(userId: number, status?: string): Promise<(SwapRequest & {
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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

  async getSkillById(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill || undefined;
  }

  async searchSkills(query: string): Promise<Skill[]> {
    return await db.select().from(skills).where(ilike(skills.name, `%${query}%`));
  }

  async getUserSkillsOffered(userId: number): Promise<(UserSkillOffered & { skill: Skill })[]> {
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

  async getUserSkillsWanted(userId: number): Promise<(UserSkillWanted & { skill: Skill })[]> {
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
    
    let whereCondition;
    if (filters?.location) {
      whereCondition = and(
        eq(users.isPublic, true),
        ilike(users.location, `%${filters.location}%`)
      );
    } else {
      whereCondition = eq(users.isPublic, true);
    }
    
    const query = db.select().from(users).where(whereCondition);
    
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

  async getSwapRequestsForUser(userId: number, status?: string): Promise<(SwapRequest & {
    requester: User;
    receiver: User;
    offeredSkill: Skill;
    requestedSkill: Skill;
  })[]> {
    const userAlias = alias(users, 'receiver');
    const offeredSkillAlias = alias(skills, 'offered_skill');
    const requestedSkillAlias = alias(skills, 'requested_skill');
    
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
        receiver: userAlias,
        offeredSkill: offeredSkillAlias,
        requestedSkill: requestedSkillAlias,
      })
      .from(swapRequests)
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .innerJoin(userAlias, eq(swapRequests.receiverId, userAlias.id))
      .innerJoin(offeredSkillAlias, eq(swapRequests.offeredSkillId, offeredSkillAlias.id))
      .innerJoin(requestedSkillAlias, eq(swapRequests.requestedSkillId, requestedSkillAlias.id))
      .where(or(eq(swapRequests.requesterId, userId), eq(swapRequests.receiverId, userId)));
    
    if (status) {
      query = db
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
          receiver: userAlias,
          offeredSkill: offeredSkillAlias,
          requestedSkill: requestedSkillAlias,
        })
        .from(swapRequests)
        .innerJoin(users, eq(swapRequests.requesterId, users.id))
        .innerJoin(userAlias, eq(swapRequests.receiverId, userAlias.id))
        .innerJoin(offeredSkillAlias, eq(swapRequests.offeredSkillId, offeredSkillAlias.id))
        .innerJoin(requestedSkillAlias, eq(swapRequests.requestedSkillId, requestedSkillAlias.id))
        .where(and(
          or(eq(swapRequests.requesterId, userId), eq(swapRequests.receiverId, userId)),
          eq(swapRequests.status, status)
        ));
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
      .where(eq(feedback.revieweeId, parseInt(userId)))
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

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    const usersList = await db.select().from(users)
      .limit(limit || 50)
      .offset(offset || 0)
      .orderBy(desc(users.createdAt));
    
    return usersList;
  }

  async updateUserStatus(userId: number, isAdmin: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
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
