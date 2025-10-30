/**
 * Seed Script: Create Test Professional Account
 * 
 * This script creates a test professional account with sample data
 * for testing the assessment flow.
 * 
 * Usage:
 *   npx tsx scripts/seed-test-professional.ts
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestAccountData {
  email: string
  password: string
  username: string
  fullName: string
  bio: string
}

const testAccounts: TestAccountData[] = [
  {
    email: 'testpro@proofstack.test',
    password: 'TestPass123!',
    username: 'testpro',
    fullName: 'Test Professional',
    bio: 'A test professional account for assessment testing'
  },
  {
    email: 'juniordev@proofstack.test',
    password: 'TestPass123!',
    username: 'juniordev',
    fullName: 'Junior Developer Test',
    bio: 'Test account at junior level for assessment progression testing'
  }
]

async function createTestProfessional(accountData: TestAccountData) {
  console.log(`\n🔧 Creating test professional: ${accountData.email}`)
  
  try {
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('username', accountData.username)
      .single()
    
    if (existingProfile) {
      console.log(`⚠️  User ${accountData.username} already exists`)
      console.log(`   Email: ${existingProfile.email}`)
      console.log(`   You can use this account for testing`)
      return existingProfile
    }

    // Create auth user
    console.log('📝 Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: accountData.fullName,
        username: accountData.username
      }
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message)
      return null
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return null
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Create profile
    console.log('📝 Creating profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        auth_uid: authData.user.id,
        email: accountData.email,
        username: accountData.username,
        full_name: accountData.fullName,
        bio: accountData.bio,
        user_type: 'professional', // Database value (UI displays as 'talent')
        skill_level: 'unverified',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return null
    }

    console.log('✅ Profile created successfully')
    console.log(`\n✨ Test Professional Account Created!`)
    console.log(`   📧 Email: ${accountData.email}`)
    console.log(`   🔑 Password: ${accountData.password}`)
    console.log(`   👤 Username: ${accountData.username}`)
    console.log(`   🎯 Skill Level: unverified`)
    console.log(`   🔗 Login URL: http://localhost:3000/auth/signin`)
    console.log(`   📊 Assessments: http://localhost:3000/professional/assessments`)

    return profile
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    return null
  }
}

async function seedTestProfessionals() {
  console.log('🌱 Seeding Test Professional Accounts\n')
  console.log('This script creates test professional accounts for assessment testing.')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  const results = []
  
  for (const accountData of testAccounts) {
    const result = await createTestProfessional(accountData)
    results.push(result)
  }

  const successful = results.filter(r => r !== null).length
  const failed = results.length - successful

  console.log('\n═══════════════════════════════════════════════════════════════════')
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully created: ${successful}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  if (successful > 0) {
    console.log(`\n🎯 Next Steps:`)
    console.log(`   1. Start the development server: npm run dev`)
    console.log(`   2. Navigate to: http://localhost:3000/auth/signin`)
    console.log(`   3. Login with any of the test accounts above`)
    console.log(`   4. Go to assessments: http://localhost:3000/professional/assessments`)
    console.log(`   5. Take the junior level tests and provide feedback`)
    console.log(`\n📚 For more details, see: TESTING_ASSESSMENTS.md\n`)
  }
}

// Run the seed script
seedTestProfessionals()
  .then(() => {
    console.log('✅ Seed script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  })
