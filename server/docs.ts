import { Express, Request, Response } from 'express';

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  admin?: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  responses: {
    status: number;
    description: string;
    example?: any;
  }[];
}

export const API_DOCUMENTATION: APIEndpoint[] = [
  // Authentication endpoints
  {
    method: 'POST',
    path: '/api/register',
    description: 'Register a new user account',
    auth: false,
    body: [
      { name: 'username', type: 'string', required: true, description: 'Unique username' },
      { name: 'password', type: 'string', required: true, description: 'Password (min 6 characters)' },
      { name: 'email', type: 'string', required: false, description: 'Email address' },
      { name: 'firstName', type: 'string', required: false, description: 'First name' },
      { name: 'lastName', type: 'string', required: false, description: 'Last name' },
    ],
    responses: [
      { status: 201, description: 'User created successfully', example: { id: 1, username: 'john_doe' } },
      { status: 400, description: 'Validation error or username exists' },
    ],
  },
  {
    method: 'POST',
    path: '/api/login',
    description: 'Authenticate user and create session',
    auth: false,
    body: [
      { name: 'username', type: 'string', required: true, description: 'Username' },
      { name: 'password', type: 'string', required: true, description: 'Password' },
    ],
    responses: [
      { status: 200, description: 'Login successful', example: { id: 1, username: 'john_doe' } },
      { status: 401, description: 'Invalid credentials' },
    ],
  },
  {
    method: 'POST',
    path: '/api/logout',
    description: 'End user session',
    auth: true,
    responses: [
      { status: 200, description: 'Logout successful' },
    ],
  },
  {
    method: 'GET',
    path: '/api/user',
    description: 'Get current user information',
    auth: true,
    responses: [
      { status: 200, description: 'User information', example: { id: 1, username: 'john_doe' } },
      { status: 401, description: 'Not authenticated' },
    ],
  },

  // Skills endpoints
  {
    method: 'GET',
    path: '/api/skills',
    description: 'Get all available skills',
    auth: false,
    responses: [
      { status: 200, description: 'List of skills', example: [{ id: 1, name: 'JavaScript', category: 'Programming' }] },
    ],
  },
  {
    method: 'POST',
    path: '/api/skills',
    description: 'Create a new skill',
    auth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Skill name' },
      { name: 'category', type: 'string', required: false, description: 'Skill category' },
      { name: 'icon', type: 'string', required: false, description: 'Icon name' },
    ],
    responses: [
      { status: 201, description: 'Skill created', example: { id: 1, name: 'JavaScript' } },
      { status: 400, description: 'Validation error' },
    ],
  },
  {
    method: 'GET',
    path: '/api/skills/search',
    description: 'Search skills by name',
    auth: false,
    parameters: [
      { name: 'q', type: 'string', required: true, description: 'Search query' },
    ],
    responses: [
      { status: 200, description: 'Matching skills' },
      { status: 400, description: 'Missing query parameter' },
    ],
  },

  // User skills endpoints
  {
    method: 'GET',
    path: '/api/user/skills/offered',
    description: 'Get skills offered by current user',
    auth: true,
    responses: [
      { status: 200, description: 'User offered skills' },
    ],
  },
  {
    method: 'POST',
    path: '/api/user/skills/offered',
    description: 'Add a skill to user offered skills',
    auth: true,
    body: [
      { name: 'skillId', type: 'number', required: true, description: 'Skill ID' },
      { name: 'proficiencyLevel', type: 'string', required: false, description: 'beginner|intermediate|advanced' },
    ],
    responses: [
      { status: 201, description: 'Skill added to offered skills' },
    ],
  },
  {
    method: 'DELETE',
    path: '/api/user/skills/offered/:id',
    description: 'Remove a skill from user offered skills',
    auth: true,
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'User skill ID' },
    ],
    responses: [
      { status: 204, description: 'Skill removed' },
    ],
  },
  {
    method: 'GET',
    path: '/api/user/skills/wanted',
    description: 'Get skills wanted by current user',
    auth: true,
    responses: [
      { status: 200, description: 'User wanted skills' },
    ],
  },
  {
    method: 'POST',
    path: '/api/user/skills/wanted',
    description: 'Add a skill to user wanted skills',
    auth: true,
    body: [
      { name: 'skillId', type: 'number', required: true, description: 'Skill ID' },
      { name: 'urgency', type: 'string', required: false, description: 'low|medium|high' },
    ],
    responses: [
      { status: 201, description: 'Skill added to wanted skills' },
    ],
  },
  {
    method: 'DELETE',
    path: '/api/user/skills/wanted/:id',
    description: 'Remove a skill from user wanted skills',
    auth: true,
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'User skill ID' },
    ],
    responses: [
      { status: 204, description: 'Skill removed' },
    ],
  },

  // Browse users endpoint
  {
    method: 'GET',
    path: '/api/users/browse',
    description: 'Browse users with filtering options',
    auth: false,
    parameters: [
      { name: 'skillQuery', type: 'string', required: false, description: 'Filter by skill name' },
      { name: 'location', type: 'string', required: false, description: 'Filter by location' },
      { name: 'availability', type: 'string', required: false, description: 'Filter by availability' },
      { name: 'limit', type: 'number', required: false, description: 'Number of results (default: 20)' },
      { name: 'offset', type: 'number', required: false, description: 'Pagination offset' },
    ],
    responses: [
      { status: 200, description: 'List of users with their skills' },
    ],
  },

  // Swap requests endpoints
  {
    method: 'POST',
    path: '/api/swap-requests',
    description: 'Create a new swap request',
    auth: true,
    body: [
      { name: 'receiverId', type: 'number', required: true, description: 'User ID to send request to' },
      { name: 'offeredSkillId', type: 'number', required: true, description: 'Skill ID being offered' },
      { name: 'requestedSkillId', type: 'number', required: true, description: 'Skill ID being requested' },
      { name: 'message', type: 'string', required: false, description: 'Optional message' },
      { name: 'preferredTime', type: 'string', required: false, description: 'Preferred time for swap' },
    ],
    responses: [
      { status: 201, description: 'Swap request created' },
      { status: 400, description: 'Validation error' },
    ],
  },
  {
    method: 'GET',
    path: '/api/swap-requests',
    description: 'Get swap requests for current user',
    auth: true,
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status: pending|accepted|declined|completed' },
    ],
    responses: [
      { status: 200, description: 'List of swap requests' },
    ],
  },
  {
    method: 'PATCH',
    path: '/api/swap-requests/:id/status',
    description: 'Update swap request status',
    auth: true,
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Swap request ID' },
    ],
    body: [
      { name: 'status', type: 'string', required: true, description: 'New status: accepted|declined|completed' },
    ],
    responses: [
      { status: 200, description: 'Status updated' },
      { status: 404, description: 'Swap request not found' },
    ],
  },

  // Feedback endpoints
  {
    method: 'POST',
    path: '/api/feedback',
    description: 'Create feedback for a completed swap',
    auth: true,
    body: [
      { name: 'swapRequestId', type: 'number', required: true, description: 'Swap request ID' },
      { name: 'revieweeId', type: 'number', required: true, description: 'User being reviewed' },
      { name: 'rating', type: 'number', required: true, description: 'Rating 1-5' },
      { name: 'comment', type: 'string', required: false, description: 'Optional comment' },
    ],
    responses: [
      { status: 201, description: 'Feedback created' },
    ],
  },
  {
    method: 'GET',
    path: '/api/users/:userId/feedback',
    description: 'Get feedback for a specific user',
    auth: false,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User ID' },
    ],
    responses: [
      { status: 200, description: 'User feedback list' },
    ],
  },

  // Messages endpoints
  {
    method: 'POST',
    path: '/api/messages',
    description: 'Send a message in a swap request',
    auth: true,
    body: [
      { name: 'swapRequestId', type: 'number', required: true, description: 'Swap request ID' },
      { name: 'content', type: 'string', required: true, description: 'Message content' },
    ],
    responses: [
      { status: 201, description: 'Message sent' },
    ],
  },
  {
    method: 'GET',
    path: '/api/swap-requests/:id/messages',
    description: 'Get messages for a swap request',
    auth: true,
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Swap request ID' },
    ],
    responses: [
      { status: 200, description: 'List of messages' },
    ],
  },

  // Admin endpoints
  {
    method: 'GET',
    path: '/api/admin/users',
    description: 'Get all users (admin only)',
    auth: true,
    admin: true,
    parameters: [
      { name: 'limit', type: 'number', required: false, description: 'Number of results' },
      { name: 'offset', type: 'number', required: false, description: 'Pagination offset' },
    ],
    responses: [
      { status: 200, description: 'List of users' },
      { status: 403, description: 'Admin access required' },
    ],
  },
  {
    method: 'GET',
    path: '/api/admin/stats',
    description: 'Get platform statistics (admin only)',
    auth: true,
    admin: true,
    responses: [
      { status: 200, description: 'Platform statistics' },
      { status: 403, description: 'Admin access required' },
    ],
  },
  {
    method: 'PATCH',
    path: '/api/admin/users/:userId/status',
    description: 'Update user admin status (admin only)',
    auth: true,
    admin: true,
    parameters: [
      { name: 'userId', type: 'number', required: true, description: 'User ID' },
    ],
    body: [
      { name: 'isAdmin', type: 'boolean', required: true, description: 'Admin status' },
    ],
    responses: [
      { status: 200, description: 'User status updated' },
      { status: 403, description: 'Admin access required' },
    ],
  },

  // Health check
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    auth: false,
    responses: [
      { status: 200, description: 'Service is healthy' },
      { status: 503, description: 'Service is unhealthy' },
    ],
  },
];

export function setupAPIDocumentation(app: Express) {
  // Serve API documentation as HTML
  app.get('/api/docs', (req: Request, res: Response) => {
    const html = generateDocumentationHTML();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Serve API documentation as JSON
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.json({
      title: 'SkillSwap Platform API',
      version: '1.0.0',
      description: 'API documentation for the SkillSwap skill-sharing platform',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: API_DOCUMENTATION,
    });
  });
}

function generateDocumentationHTML(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SkillSwap API Documentation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
        h2 { color: #4f46e5; margin-top: 30px; }
        .endpoint { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; margin: 20px 0; padding: 20px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .method.GET { background: #28a745; color: white; }
        .method.POST { background: #007bff; color: white; }
        .method.PUT { background: #ffc107; color: black; }
        .method.PATCH { background: #17a2b8; color: white; }
        .method.DELETE { background: #dc3545; color: white; }
        .auth-required { background: #fff3cd; border: 1px solid #ffeaa7; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #856404; }
        .admin-required { background: #f8d7da; border: 1px solid #f5c6cb; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #721c24; }
        .params, .body, .responses { margin: 15px 0; }
        .param { background: white; border: 1px solid #dee2e6; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .param-name { font-weight: bold; color: #495057; }
        .param-type { color: #6c757d; font-style: italic; }
        .required { color: #dc3545; }
        .response { background: white; border-left: 4px solid #28a745; padding: 10px; margin: 5px 0; }
        .response.error { border-left-color: #dc3545; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', 'Consolas', monospace; }
        .toc { background: #e9ecef; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .toc ul { list-style: none; padding: 0; }
        .toc li { margin: 5px 0; }
        .toc a { text-decoration: none; color: #4f46e5; }
        .toc a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔄 SkillSwap Platform API Documentation</h1>
        <p>Welcome to the SkillSwap API documentation. This API enables skill-sharing functionality including user management, skill matching, swap requests, and messaging.</p>
        
        <div class="toc">
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#authentication">Authentication</a></li>
            <li><a href="#skills">Skills Management</a></li>
            <li><a href="#user-skills">User Skills</a></li>
            <li><a href="#browse">Browse Users</a></li>
            <li><a href="#swap-requests">Swap Requests</a></li>
            <li><a href="#feedback">Feedback</a></li>
            <li><a href="#messages">Messages</a></li>
            <li><a href="#admin">Admin</a></li>
            <li><a href="#health">Health Check</a></li>
          </ul>
        </div>

        <h2 id="base-url">Base URL</h2>
        <p><code>https://your-domain.com</code></p>

        <h2 id="authentication-info">Authentication</h2>
        <p>This API uses session-based authentication. After logging in, your session cookie will be used for authenticated requests.</p>

        ${generateEndpointsHTML()}
      </div>
    </body>
    </html>
  `;
}

function generateEndpointsHTML(): string {
  const sections = {
    'Authentication': ['POST /api/register', 'POST /api/login', 'POST /api/logout', 'GET /api/user'],
    'Skills Management': ['GET /api/skills', 'POST /api/skills', 'GET /api/skills/search'],
    'User Skills': [
      'GET /api/user/skills/offered', 'POST /api/user/skills/offered', 'DELETE /api/user/skills/offered/:id',
      'GET /api/user/skills/wanted', 'POST /api/user/skills/wanted', 'DELETE /api/user/skills/wanted/:id'
    ],
    'Browse Users': ['GET /api/users/browse'],
    'Swap Requests': ['POST /api/swap-requests', 'GET /api/swap-requests', 'PATCH /api/swap-requests/:id/status'],
    'Feedback': ['POST /api/feedback', 'GET /api/users/:userId/feedback'],
    'Messages': ['POST /api/messages', 'GET /api/swap-requests/:id/messages'],
    'Admin': ['GET /api/admin/users', 'GET /api/admin/stats', 'PATCH /api/admin/users/:userId/status'],
    'Health Check': ['GET /api/health']
  };

  let html = '';

  Object.entries(sections).forEach(([sectionName, endpoints]) => {
    const sectionId = sectionName.toLowerCase().replace(/\s+/g, '-');
    html += `<h2 id="${sectionId}">${sectionName}</h2>`;
    
    endpoints.forEach(endpointPath => {
      const endpoint = API_DOCUMENTATION.find(ep => `${ep.method} ${ep.path}` === endpointPath);
      if (endpoint) {
        html += generateEndpointHTML(endpoint);
      }
    });
  });

  return html;
}

function generateEndpointHTML(endpoint: APIEndpoint): string {
  return `
    <div class="endpoint">
      <h3>
        <span class="method ${endpoint.method}">${endpoint.method}</span>
        <code>${endpoint.path}</code>
        ${endpoint.auth ? '<span class="auth-required">🔐 Auth Required</span>' : ''}
        ${endpoint.admin ? '<span class="admin-required">👑 Admin Only</span>' : ''}
      </h3>
      <p>${endpoint.description}</p>
      
      ${endpoint.parameters ? `
        <div class="params">
          <h4>Parameters</h4>
          ${endpoint.parameters.map(param => `
            <div class="param">
              <span class="param-name">${param.name}</span>
              <span class="param-type">(${param.type})</span>
              ${param.required ? '<span class="required">*required</span>' : ''}
              <p>${param.description}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${endpoint.body ? `
        <div class="body">
          <h4>Request Body</h4>
          ${endpoint.body.map(field => `
            <div class="param">
              <span class="param-name">${field.name}</span>
              <span class="param-type">(${field.type})</span>
              ${field.required ? '<span class="required">*required</span>' : ''}
              <p>${field.description}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="responses">
        <h4>Responses</h4>
        ${endpoint.responses.map(response => `
          <div class="response ${response.status >= 400 ? 'error' : ''}">
            <strong>${response.status}</strong> - ${response.description}
            ${response.example ? `<pre><code>${JSON.stringify(response.example, null, 2)}</code></pre>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
