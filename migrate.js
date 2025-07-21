import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
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
            throw error;
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    client.release();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
