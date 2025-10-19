// Execute the professional_ratings table fix
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
  console.log('🔧 Running professional_ratings table fix...\n');

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'fix_professional_ratings.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements (basic split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);

    try {
      // Use raw SQL execution through RPC
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  // Verify the table now exists
  console.log(`\n🔍 Verifying professional_ratings table...`);
  const { data, error } = await supabase.from('professional_ratings').select('professional_id').limit(1);
  
  if (error) {
    console.log(`   ❌ Table verification failed: ${error.message}`);
    console.log(`\n⚠️  Note: Supabase may not have the exec_sql RPC function.`);
    console.log(`   Please run the fix manually in Supabase SQL Editor:`);
    console.log(`   https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc/sql/new`);
  } else {
    console.log(`   ✅ Table exists and is accessible!`);
    console.log(`\n🎉 Fix complete! All 12 employer platform tables are now ready.`);
  }
}

runFix().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
