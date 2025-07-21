import { pool } from './db';

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    // Simple query to test connection
    const result = await pool.query('SELECT 1 as health_check');
    return { healthy: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  const health = await checkDatabaseHealth();
  
  if (health.healthy) {
    console.log('✅ Database connection is healthy');
  } else {
    console.error('❌ Database connection failed:', health.error);
  }
  
  return health;
}
