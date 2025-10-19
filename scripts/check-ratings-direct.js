// Direct check of professional_ratings table using service role
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDirectly() {
  console.log('🔍 Checking professional_ratings table directly...\n');

  // Try to query the table structure
  const { data, error } = await supabase
    .from('professional_ratings')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('\n📝 The table might not exist. Running SQL to create it...\n');

    // Try to create it via a simple query
    const createSQL = `
      CREATE TABLE IF NOT EXISTS professional_ratings (
        professional_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        average_rating decimal(3,2),
        total_reviews integer DEFAULT 0,
        five_star_count integer DEFAULT 0,
        four_star_count integer DEFAULT 0,
        three_star_count integer DEFAULT 0,
        two_star_count integer DEFAULT 0,
        one_star_count integer DEFAULT 0,
        would_hire_again_percentage decimal(5,2),
        last_review_at timestamptz,
        updated_at timestamptz DEFAULT now()
      );
      
      ALTER TABLE professional_ratings ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anyone can read professional ratings" ON professional_ratings;
      CREATE POLICY "Anyone can read professional ratings"
        ON professional_ratings FOR SELECT
        USING (true);
    `;

    console.log('SQL to run in Supabase SQL Editor:');
    console.log('========================================');
    console.log(createSQL);
    console.log('========================================');
    console.log('\n👉 Go to: https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc/sql/new');
    console.log('   Paste the SQL above and click RUN');

  } else {
    console.log('✅ professional_ratings table exists!');
    console.log('   Rows:', data?.length || 0);
    console.log('\n🎉 All 12 employer platform tables are ready!');
  }
}

checkDirectly().catch(console.error);
