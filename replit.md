# Skill Swap - A Community-Driven Skill Exchange Platform

## Overview

Skill Swap is a modern web application that enables users to trade skills and knowledge within a community-driven platform. Users can list skills they offer, discover what others can teach, and arrange skill exchanges. The platform features a clean, responsive design with authentication, user profiles, skill management, and swap request functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application
The application follows a monorepo structure with separate client and server directories, sharing common types and schemas through a shared directory. Built with modern web technologies prioritizing type safety and developer experience.

**Technology Stack:**
- **Frontend**: React with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth integration
- **UI Framework**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query for server state

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and database schema
├── migrations/      # Database migration files
└── attached_assets/ # Design specifications and assets
```

## Key Components

### Frontend Architecture
- **React with TypeScript**: Component-based UI with strict typing
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **Shadcn/ui**: Pre-built accessible UI components based on Radix UI
- **Tailwind CSS**: Utility-first styling with custom design tokens

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Session Management**: PostgreSQL-backed sessions for authentication
- **Replit Auth**: OAuth integration for user authentication

### Database Design
- **Users**: Core user profile information with OAuth integration
- **Skills**: Categorized skill definitions with icons
- **User Skills**: Many-to-many relationships for offered/wanted skills
- **Swap Requests**: Skill exchange proposals between users
- **Feedback**: Post-exchange rating and review system
- **Messages**: Communication between users (planned feature)

## Data Flow

### Authentication Flow
1. Users authenticate via Replit OAuth
2. Session stored in PostgreSQL with automatic cleanup
3. Protected routes verify authentication status
4. User profile created/updated on first login

### Skill Management Flow
1. Users search/create skills from global skill catalog
2. Skills added to personal "offered" or "wanted" lists
3. Skills categorized and tagged for easy discovery
4. Real-time updates via TanStack Query mutations

### Swap Request Flow
1. Users browse profiles and discover relevant skills
2. Swap requests created with offered/requested skill pairs
3. Request notifications and status management
4. Completion triggers feedback collection system

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle Kit**: Database migration and schema management

### Authentication
- **Replit OAuth**: Primary authentication provider
- **OpenID Connect**: Standard OAuth implementation

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Consistent icon system
- **date-fns**: Date manipulation utilities
- **React Hook Form**: Form state management with validation

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Production bundle optimization
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **TSX**: TypeScript execution for backend development
- **File Watching**: Automatic server restarts on changes

### Production Build
- **Vite Build**: Optimized frontend bundle generation
- **ESBuild**: Server-side bundle creation with external packages
- **Static Asset Serving**: Frontend served from Express in production

### Database Management
- **Drizzle Push**: Schema synchronization for development
- **Migration System**: Version-controlled database changes
- **Connection Pooling**: Efficient database connection management

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Secure session encryption key
- **REPL_ID & ISSUER_URL**: Replit OAuth configuration
- **NODE_ENV**: Environment-specific behavior control

The application is designed for easy deployment on Replit with automatic database provisioning and OAuth integration, while maintaining flexibility for other hosting platforms.