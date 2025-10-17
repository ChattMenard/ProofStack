/**
 * Apply Supabase migrations
 * 
 * This script applies database migrations to your Supabase project.
 * Usage: node scripts/apply-migrations.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }

  // Get all .sql files in migrations directory
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()

  console.log(`📦 Found ${files.length} migration files`)
  console.log('')

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')

    console.log(`🔄 Applying migration: ${file}`)
    
    try {
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql })
      
      if (error) {
        // If rpc doesn't exist, try direct execution (requires proper permissions)
        console.log('   Trying direct SQL execution...')
        
        // Split on semicolons but preserve function bodies
        const statements = splitSqlStatements(sql)
        
        for (const statement of statements) {
          const trimmed = statement.trim()
          if (trimmed && !trimmed.startsWith('--')) {
            const { error: execError } = await supabase.rpc('exec', { query: trimmed })
            
            if (execError) {
              console.error(`   ❌ Error: ${execError.message}`)
              console.error(`   Statement: ${trimmed.substring(0, 100)}...`)
              throw execError
            }
          }
        }
      }
      
      console.log(`   ✅ Successfully applied ${file}`)
    } catch (err) {
      console.error(`   ❌ Failed to apply ${file}:`, err.message)
      console.error('')
      console.error('💡 Alternative: Copy the SQL from the migration file and run it manually in:')
      console.error(`   ${supabaseUrl.replace('/v1', '')}/project/default/sql`)
      console.error('')
      console.error(`📄 Migration file: ${filePath}`)
      process.exit(1)
    }
  }

  console.log('')
  console.log('✨ All migrations applied successfully!')
}

function splitSqlStatements(sql) {
  // Simple SQL statement splitter that preserves function bodies
  const statements = []
  let current = ''
  let inFunction = false
  let dollarQuoteCount = 0
  
  const lines = sql.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Track function boundaries
    if (trimmed.match(/CREATE( OR REPLACE)? FUNCTION/i)) {
      inFunction = true
    }
    
    // Track dollar quotes ($$)
    const dollarMatches = line.match(/\$\$/g)
    if (dollarMatches) {
      dollarQuoteCount += dollarMatches.length
    }
    
    current += line + '\n'
    
    // End of statement detection
    if (trimmed.endsWith(';') && (!inFunction || dollarQuoteCount % 2 === 0)) {
      if (inFunction && dollarQuoteCount % 2 === 0) {
        inFunction = false
      }
      
      if (!inFunction) {
        statements.push(current)
        current = ''
        dollarQuoteCount = 0
      }
    }
  }
  
  if (current.trim()) {
    statements.push(current)
  }
  
  return statements
}

// Run migrations
console.log('🚀 Starting migration process...')
console.log('')
applyMigrations().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
