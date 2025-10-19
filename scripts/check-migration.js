// Quick script to check if employer platform tables exist
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tablesToCheck = [
    'organizations',
    'organization_members', 
    'professional_promotions',
    'employer_reviews',
    'professional_ratings',
    'conversations',
    'conversation_participants',
    'messages',
    'connections',
    'saved_candidates',
    'search_history',
    'profile_views'
  ];

  console.log('🔍 Checking employer platform tables...\n');
  
  let existCount = 0;
  let missingCount = 0;
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    
    if (error) {
      console.log(`❌ ${table}: NOT FOUND`);
      missingCount++;
    } else {
      console.log(`✅ ${table}: exists`);
      existCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${existCount}/${tablesToCheck.length} tables exist`);
  
  if (missingCount === tablesToCheck.length) {
    console.log('\n🔴 MIGRATION NOT RUN - All tables missing');
    console.log('👉 Next step: Run migration in Supabase SQL Editor');
    console.log('   URL: https://lytjmxjizalmgbgrgfvc.supabase.co/project/lytjmxjizalmgbgrgfvc/sql/new');
  } else if (missingCount > 0) {
    console.log('\n🟡 PARTIAL MIGRATION - Some tables missing');
  } else {
    console.log('\n🟢 MIGRATION COMPLETE - All tables exist!');
  }
}

checkTables().catch(console.error);
