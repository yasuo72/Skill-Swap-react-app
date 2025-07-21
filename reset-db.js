import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
    
    // Drop all tables (except sessions which we might want to keep)
    for (const row of tablesResult.rows) {
      if (row.table_name !== 'sessions') {
        console.log(`Dropping table: ${row.table_name}`);
        await client.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE;`);
      }
    }
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '0000_same_colossus.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement breakpoints and execute each statement
    const statements = migrationSQL.split('-- statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    console.log(`Executing ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && !statement.startsWith('-->')) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        try {
          await client.query(statement);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Skipping statement ${i + 1} (already exists)`);
          } else {
            console.error(`Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    // Verify tables were created
    const newTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Tables after migration:', newTablesResult.rows.map(r => r.table_name));
    
    // Check users table specifically
    const usersColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    usersColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('Database reset completed successfully!');
    client.release();
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
