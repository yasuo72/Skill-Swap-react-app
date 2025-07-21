import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function seedDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Insert some initial skills
    const skills = [
      { name: 'JavaScript', category: 'Programming', icon: 'code' },
      { name: 'Python', category: 'Programming', icon: 'code' },
      { name: 'React', category: 'Frontend', icon: 'code' },
      { name: 'Node.js', category: 'Backend', icon: 'server' },
      { name: 'Graphic Design', category: 'Design', icon: 'palette' },
      { name: 'Photography', category: 'Creative', icon: 'camera' },
      { name: 'Spanish', category: 'Language', icon: 'globe' },
      { name: 'French', category: 'Language', icon: 'globe' },
      { name: 'Guitar', category: 'Music', icon: 'music' },
      { name: 'Piano', category: 'Music', icon: 'music' },
      { name: 'Cooking', category: 'Lifestyle', icon: 'chef-hat' },
      { name: 'Yoga', category: 'Fitness', icon: 'heart' },
      { name: 'Marketing', category: 'Business', icon: 'trending-up' },
      { name: 'Writing', category: 'Creative', icon: 'pen-tool' },
      { name: 'Data Science', category: 'Programming', icon: 'bar-chart' }
    ];
    
    console.log('Inserting skills...');
    for (const skill of skills) {
      try {
        await client.query(
          'INSERT INTO skills (name, category, icon) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [skill.name, skill.category, skill.icon]
        );
        console.log(`✓ Added skill: ${skill.name}`);
      } catch (error) {
        console.log(`- Skill ${skill.name} already exists`);
      }
    }
    
    console.log('Database seeded successfully!');
    client.release();
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
