import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function checkDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check users table structure if it exists
    const usersTableExists = tablesResult.rows.some(row => row.table_name === 'users');
    if (usersTableExists) {
      console.log('\nUsers table columns:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('\nUsers table does not exist!');
    }
    
    client.release();
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
