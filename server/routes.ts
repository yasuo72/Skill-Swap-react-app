import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSkillSchema, 
  insertUserSkillOfferedSchema, 
  insertUserSkillWantedSchema,
  insertSwapRequestSchema,
  insertFeedbackSchema,
  insertMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Skills routes
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(skillData);
      res.status(201).json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.get('/api/skills/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const skills = await storage.searchSkills(query);
      res.json(skills);
    } catch (error) {
      console.error("Error searching skills:", error);
      res.status(500).json({ message: "Failed to search skills" });
    }
  });

  // User skills routes
  app.get('/api/user/skills/offered', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skills = await storage.getUserSkillsOffered(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching offered skills:", error);
      res.status(500).json({ message: "Failed to fetch offered skills" });
    }
  });

  app.post('/api/user/skills/offered', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skillData = insertUserSkillOfferedSchema.parse({ ...req.body, userId });
      const userSkill = await storage.addUserSkillOffered(skillData);
      res.status(201).json(userSkill);
    } catch (error) {
      console.error("Error adding offered skill:", error);
      res.status(500).json({ message: "Failed to add offered skill" });
    }
  });

  app.delete('/api/user/skills/offered/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeUserSkillOffered(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing offered skill:", error);
      res.status(500).json({ message: "Failed to remove offered skill" });
    }
  });

  app.get('/api/user/skills/wanted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skills = await storage.getUserSkillsWanted(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching wanted skills:", error);
      res.status(500).json({ message: "Failed to fetch wanted skills" });
    }
  });

  app.post('/api/user/skills/wanted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skillData = insertUserSkillWantedSchema.parse({ ...req.body, userId });
      const userSkill = await storage.addUserSkillWanted(skillData);
      res.status(201).json(userSkill);
    } catch (error) {
      console.error("Error adding wanted skill:", error);
      res.status(500).json({ message: "Failed to add wanted skill" });
    }
  });

  app.delete('/api/user/skills/wanted/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeUserSkillWanted(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing wanted skill:", error);
      res.status(500).json({ message: "Failed to remove wanted skill" });
    }
  });

  // Browse users
  app.get('/api/users/browse', async (req, res) => {
    try {
      const filters = {
        skillQuery: req.query.skill as string,
        availability: req.query.availability ? (req.query.availability as string).split(',') : undefined,
        location: req.query.location as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const users = await storage.browseUsers(filters);
      res.json(users);
    } catch (error) {
      console.error("Error browsing users:", error);
      res.status(500).json({ message: "Failed to browse users" });
    }
  });

  // Swap requests
  app.get('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = req.query.status as string;
      const swapRequests = await storage.getSwapRequestsForUser(userId, status);
      res.json(swapRequests);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const swapRequestData = insertSwapRequestSchema.parse({ ...req.body, requesterId });
      const swapRequest = await storage.createSwapRequest(swapRequestData);
      res.status(201).json(swapRequest);
    } catch (error) {
      console.error("Error creating swap request:", error);
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.patch('/api/swap-requests/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const swapRequest = await storage.updateSwapRequestStatus(id, status);
      res.json(swapRequest);
    } catch (error) {
      console.error("Error updating swap request:", error);
      res.status(500).json({ message: "Failed to update swap request" });
    }
  });

  // Feedback
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, reviewerId });
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get('/api/users/:userId/feedback', async (req, res) => {
    try {
      const userId = req.params.userId;
      const feedback = await storage.getUserFeedback(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      res.status(500).json({ message: "Failed to fetch user feedback" });
    }
  });

  // Messages
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/swap-requests/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const swapRequestId = parseInt(req.params.id);
      const messages = await storage.getSwapRequestMessages(swapRequestId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const users = await storage.getAllUsers(limit, offset);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  app.patch('/api/admin/users/:userId/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.userId;
      const { isAdmin } = req.body;
      const updatedUser = await storage.updateUserStatus(userId, isAdmin);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
