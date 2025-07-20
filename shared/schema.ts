import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  title: varchar("title"),
  location: varchar("location"),
  isPublic: boolean("is_public").default(true),
  availability: text("availability").array(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSkillsOffered = pgTable("user_skills_offered", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }).default("intermediate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSkillsWanted = pgTable("user_skills_wanted", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  urgency: varchar("urgency", { length: 20 }).default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offeredSkillId: integer("offered_skill_id").notNull().references(() => skills.id),
  requestedSkillId: integer("requested_skill_id").notNull().references(() => skills.id),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  preferredTime: varchar("preferred_time", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  swapRequestId: integer("swap_request_id").notNull().references(() => swapRequests.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  swapRequestId: integer("swap_request_id").notNull().references(() => swapRequests.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  skillsOffered: many(userSkillsOffered),
  skillsWanted: many(userSkillsWanted),
  swapRequestsSent: many(swapRequests, { relationName: "requester" }),
  swapRequestsReceived: many(swapRequests, { relationName: "receiver" }),
  feedbackGiven: many(feedback, { relationName: "reviewer" }),
  feedbackReceived: many(feedback, { relationName: "reviewee" }),
  messagesSent: many(messages),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  usersOffering: many(userSkillsOffered),
  usersWanting: many(userSkillsWanted),
  swapRequestsOffered: many(swapRequests, { relationName: "offeredSkill" }),
  swapRequestsRequested: many(swapRequests, { relationName: "requestedSkill" }),
}));

export const userSkillsOfferedRelations = relations(userSkillsOffered, ({ one }) => ({
  user: one(users, { fields: [userSkillsOffered.userId], references: [users.id] }),
  skill: one(skills, { fields: [userSkillsOffered.skillId], references: [skills.id] }),
}));

export const userSkillsWantedRelations = relations(userSkillsWanted, ({ one }) => ({
  user: one(users, { fields: [userSkillsWanted.userId], references: [users.id] }),
  skill: one(skills, { fields: [userSkillsWanted.skillId], references: [skills.id] }),
}));

export const swapRequestsRelations = relations(swapRequests, ({ one, many }) => ({
  requester: one(users, { fields: [swapRequests.requesterId], references: [users.id], relationName: "requester" }),
  receiver: one(users, { fields: [swapRequests.receiverId], references: [users.id], relationName: "receiver" }),
  offeredSkill: one(skills, { fields: [swapRequests.offeredSkillId], references: [skills.id], relationName: "offeredSkill" }),
  requestedSkill: one(skills, { fields: [swapRequests.requestedSkillId], references: [skills.id], relationName: "requestedSkill" }),
  feedback: many(feedback),
  messages: many(messages),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  swapRequest: one(swapRequests, { fields: [feedback.swapRequestId], references: [swapRequests.id] }),
  reviewer: one(users, { fields: [feedback.reviewerId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [feedback.revieweeId], references: [users.id], relationName: "reviewee" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  swapRequest: one(swapRequests, { fields: [messages.swapRequestId], references: [swapRequests.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export const insertUserSkillOfferedSchema = createInsertSchema(userSkillsOffered).omit({
  id: true,
  createdAt: true,
});

export const insertUserSkillWantedSchema = createInsertSchema(userSkillsWanted).omit({
  id: true,
  createdAt: true,
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type UserSkillOffered = typeof userSkillsOffered.$inferSelect;
export type UserSkillWanted = typeof userSkillsWanted.$inferSelect;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertUserSkillOffered = z.infer<typeof insertUserSkillOfferedSchema>;
export type InsertUserSkillWanted = z.infer<typeof insertUserSkillWantedSchema>;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
