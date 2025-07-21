import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { storage } from './storage';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? "http://localhost:5173" : false,
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token;
        // In a real app, you'd verify JWT token here
        // For now, we'll use session-based auth from the handshake
        const userId = socket.handshake.auth.userId;
        const username = socket.handshake.auth.username;
        
        if (userId && username) {
          socket.userId = parseInt(userId);
          socket.username = username;
          next();
        } else {
          next(new Error('Authentication failed'));
        }
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.username} connected (${socket.id})`);
      
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
      }

      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`);

      // Handle joining swap request rooms for messaging
      socket.on('join_swap_room', (swapRequestId: number) => {
        socket.join(`swap_${swapRequestId}`);
      });

      // Handle leaving swap request rooms
      socket.on('leave_swap_room', (swapRequestId: number) => {
        socket.leave(`swap_${swapRequestId}`);
      });

      // Handle new messages in swap requests
      socket.on('send_message', async (data: {
        swapRequestId: number;
        content: string;
      }) => {
        try {
          if (!socket.userId) return;

          const message = await storage.createMessage({
            swapRequestId: data.swapRequestId,
            senderId: socket.userId,
            content: data.content
          });

          // Get the full message with sender info
          const fullMessage = await storage.getSwapRequestMessages(data.swapRequestId);
          const newMessage = fullMessage[fullMessage.length - 1];

          // Broadcast to all users in the swap room
          this.io.to(`swap_${data.swapRequestId}`).emit('new_message', newMessage);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (swapRequestId: number) => {
        socket.to(`swap_${swapRequestId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username
        });
      });

      socket.on('typing_stop', (swapRequestId: number) => {
        socket.to(`swap_${swapRequestId}`).emit('user_stopped_typing', {
          userId: socket.userId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.username} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });
  }

  // Public methods for sending notifications
  public sendNotificationToUser(userId: number, notification: any) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  public sendSwapRequestUpdate(swapRequestId: number, update: any) {
    this.io.to(`swap_${swapRequestId}`).emit('swap_update', update);
  }

  public broadcastSkillUpdate(skillUpdate: any) {
    this.io.emit('skill_update', skillUpdate);
  }

  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export let wsService: WebSocketService;

export function initializeWebSocket(httpServer: HttpServer) {
  wsService = new WebSocketService(httpServer);
  return wsService;
}
