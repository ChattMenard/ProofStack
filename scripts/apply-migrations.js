/**
 * Apply Supabase migrations
 * 
 * This script applies database migrations to your Supabase project.
 * Usage: node scripts/apply-migrations.js [specific-file.sql]
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
})

async function executeSql(sql) {
  try {
    // Use the Supabase Management API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      // If exec RPC doesn't exist, execute via direct query
      // This requires splitting statements and using Supabase's query builder
      const statements = splitSqlStatements(sql)
      
      for (const statement of statements) {
        const trimmed = statement.trim()
        if (!trimmed || trimmed.startsWith('--')) continue
        
        // Execute via raw query (requires service role key)
        const { error } = await supabase.rpc('exec_sql', { sql_string: trimmed })
        if (error) throw error
      }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

async function applyMigrations(specificFile) {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }

  // Get all .sql files in migrations directory
  let files
  
  if (specificFile) {
    // Apply specific migration file
    const migrationPath = specificFile.includes('/') || specificFile.includes('\\')
      ? specificFile
      : path.join(migrationsDir, specificFile)
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }
    
    files = [path.basename(migrationPath)]
    console.log(`📦 Applying specific migration: ${files[0]}`)
  } else {
    // Apply all migrations
    files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`📦 Found ${files.length} migration files`)
  }
  
  console.log('')

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')

    console.log(`🔄 Applying migration: ${file}`)
    
    try {
      const result = await executeSql(sql)
      
      if (!result.success) {
        throw result.error
      }
      
      console.log(`   ✅ Successfully applied ${file}`)
    } catch (err) {
      console.error(`   ❌ Failed to apply ${file}:`, err.message || err)
      console.error('')
      console.error('💡 You can run this migration manually in Supabase SQL Editor:')
      console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/').split('.supabase.co')[0].replace('https://supabase.com/dashboard/project/', 'https://supabase.com/dashboard/project/')}/sql`)
      console.error('')
      console.error(`📄 Migration file: ${filePath}`)
      console.error('')
      console.error('🔍 SQL to run:')
      console.error('─'.repeat(50))
      console.error(sql)
      console.error('─'.repeat(50))
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
const specificFile = process.argv[2] // Optional: node scripts/apply-migrations.js 20251018_auto_create_profile.sql
console.log('🚀 Starting migration process...')
console.log('')
applyMigrations(specificFile).catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
