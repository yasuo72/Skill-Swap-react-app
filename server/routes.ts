import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertSkillSchema, 
  insertUserSkillOfferedSchema, 
  insertUserSkillWantedSchema,
  insertSwapRequestSchema,
  insertFeedbackSchema,
  insertMessageSchema 
} from "@shared/schema";
import { cacheService } from "./cache";
import { upload, FileUploadService, handleUploadError } from "./upload";
import { emailService } from "./email";
import { wsService } from "./websocket";
import { 
  generalLimiter, 
  authLimiter, 
  uploadLimiter, 
  messageLimiter,
  sanitizeInput,
  validateContent,
  requireAdmin,
  requireOwnership
} from "./security";
import { setupAPIDocumentation } from "./docs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup API documentation
  setupAPIDocumentation(app);
  
  // Auth middleware
  setupAuth(app);

  // Auth routes are handled in auth.ts
  
  // File upload routes
  app.post('/api/upload/profile-image', 
    uploadLimiter,
    isAuthenticated, 
    upload.single('image'), 
    async (req: any, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const userId = req.user.id;
        const imageUrl = await FileUploadService.processProfileImage(req.file, userId);
        
        // Update user profile with new image URL
        // This would require adding updateUser method to storage
        
        res.json({ imageUrl });
      } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ message: 'Failed to upload image' });
      }
    },
    handleUploadError
  );

  // Skills routes with caching
  app.get('/api/skills', async (req, res) => {
    try {
      // Check cache first
      const cachedSkills = cacheService.getCachedSkills();
      if (cachedSkills) {
        return res.json(cachedSkills);
      }
      
      const skills = await storage.getAllSkills();
      cacheService.cacheSkills(skills);
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
      const userId = req.user.id;
      const skills = await storage.getUserSkillsOffered(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching offered skills:", error);
      res.status(500).json({ message: "Failed to fetch offered skills" });
    }
  });

  app.post('/api/user/skills/offered', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const skills = await storage.getUserSkillsWanted(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching wanted skills:", error);
      res.status(500).json({ message: "Failed to fetch wanted skills" });
    }
  });

  app.post('/api/user/skills/wanted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const requesterId = req.user.id;
      const swapRequestData = insertSwapRequestSchema.parse({ ...req.body, requesterId });
      const swapRequest = await storage.createSwapRequest(swapRequestData);
      
      // Send real-time notification to receiver
      if (wsService) {
        wsService.sendNotificationToUser(swapRequestData.receiverId, {
          type: 'new_swap_request',
          swapRequest,
          requester: req.user
        });
      }
      
      // Send email notification
      try {
        const receiver = await storage.getUser(swapRequestData.receiverId);
        const offeredSkill = await storage.getSkillById(swapRequestData.offeredSkillId);
        const requestedSkill = await storage.getSkillById(swapRequestData.requestedSkillId);
        
        if (receiver && offeredSkill && requestedSkill) {
          await emailService.sendSwapRequestNotification(
            receiver, req.user, offeredSkill, requestedSkill, swapRequestData.message || undefined
          );
        }
      } catch (emailError) {
        console.warn('Failed to send email notification:', emailError);
      }
      
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
      const reviewerId = req.user.id;
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
      const senderId = req.user.id;
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
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = parseInt(req.params.userId);
      const { isAdmin } = req.body;
      const updatedUser = await storage.updateUserStatus(userId, isAdmin);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Database health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const { checkDatabaseHealth } = await import('./db-health');
      const health = await checkDatabaseHealth();
      
      if (health.healthy) {
        res.json({ status: 'healthy', database: 'connected' });
      } else {
        res.status(503).json({ 
          status: 'unhealthy', 
          database: 'disconnected',
          error: health.error 
        });
      }
    } catch (error) {
      res.status(503).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
