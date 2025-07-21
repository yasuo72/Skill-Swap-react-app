import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function createTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Create tables one by one with explicit SQL
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(50) NOT NULL,
        "password" varchar(255) NOT NULL,
        "email" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "title" varchar,
        "location" varchar,
        "is_public" boolean DEFAULT true,
        "availability" text[],
        "is_admin" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);
    
    console.log('Creating skills table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "skills" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "category" varchar(50),
        "icon" varchar(50),
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "skills_name_unique" UNIQUE("name")
      );
    `);
    
    console.log('Creating user_skills_offered table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_skills_offered" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        "proficiency_level" varchar(20) DEFAULT 'intermediate',
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    console.log('Creating user_skills_wanted table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_skills_wanted" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        "urgency" varchar(20) DEFAULT 'medium',
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    console.log('Creating swap_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "swap_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "requester_id" integer NOT NULL,
        "receiver_id" integer NOT NULL,
        "offered_skill_id" integer NOT NULL,
        "requested_skill_id" integer NOT NULL,
        "message" text,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "preferred_time" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    
    console.log('Creating feedback table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "feedback" (
        "id" serial PRIMARY KEY NOT NULL,
        "swap_request_id" integer NOT NULL,
        "reviewer_id" integer NOT NULL,
        "reviewee_id" integer NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    console.log('Creating messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "swap_request_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "content" text NOT NULL,
        "is_read" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    console.log('Adding foreign key constraints...');
    
    // Add foreign keys for user_skills_offered
    await client.query(`
      ALTER TABLE "user_skills_offered" 
      DROP CONSTRAINT IF EXISTS "user_skills_offered_user_id_users_id_fk";
    `);
    await client.query(`
      ALTER TABLE "user_skills_offered" 
      ADD CONSTRAINT "user_skills_offered_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    `);
    
    await client.query(`
      ALTER TABLE "user_skills_offered" 
      DROP CONSTRAINT IF EXISTS "user_skills_offered_skill_id_skills_id_fk";
    `);
    await client.query(`
      ALTER TABLE "user_skills_offered" 
      ADD CONSTRAINT "user_skills_offered_skill_id_skills_id_fk" 
      FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
    `);
    
    // Add foreign keys for user_skills_wanted
    await client.query(`
      ALTER TABLE "user_skills_wanted" 
      DROP CONSTRAINT IF EXISTS "user_skills_wanted_user_id_users_id_fk";
    `);
    await client.query(`
      ALTER TABLE "user_skills_wanted" 
      ADD CONSTRAINT "user_skills_wanted_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    `);
    
    await client.query(`
      ALTER TABLE "user_skills_wanted" 
      DROP CONSTRAINT IF EXISTS "user_skills_wanted_skill_id_skills_id_fk";
    `);
    await client.query(`
      ALTER TABLE "user_skills_wanted" 
      ADD CONSTRAINT "user_skills_wanted_skill_id_skills_id_fk" 
      FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
    `);
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Tables created:', tablesResult.rows.map(r => r.table_name));
    
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
    
    console.log('All tables created successfully!');
    client.release();
  } catch (error) {
    console.error('Table creation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
