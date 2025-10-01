// scripts/signal-ingestion-cron.ts
const { createClient } = require('@supabase/supabase-js')
const cron = require('node-cron')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(' Missing Supabase environment variables')
  console.log('Make sure you have these in your .env.local:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Types
interface MockSignalData {
  company_name: string
  signal_type: 'funding' | 'team_expansion' | 'product_launch' | 'office_opening' | 'leadership_change' | 'job_posting'
  title: string
  description: string
  confidence_score?: number
  source_url?: string
  detected_at?: string
  metadata?: Record<string, any>
}

interface HiringSignalInsert {
  company_id: string
  signal_type: string
  title: string
  description: string
  confidence_score: number
  source_url?: string
  detected_at?: string
  metadata?: Record<string, any>
}

// Mock data
const MOCK_SIGNAL_DATA: MockSignalData[] = [
  {
    company_name: "Stripe",
    signal_type: "funding",
    title: "Stripe raises $6.5B Series H funding",
    description: "Stripe announced a massive Series H funding round, bringing their valuation to $50B.",
    confidence_score: 9,
    source_url: "https://techcrunch.com/stripe-funding",
    metadata: {
      funding_amount: "$6.5B",
      valuation: "$50B",
      round_type: "Series H"
    }
  },
  {
    company_name: "OpenAI",
    signal_type: "job_posting",
    title: "OpenAI posts 15+ senior engineering roles",
    description: "OpenAI has posted multiple senior engineering positions across AI Research teams.",
    confidence_score: 8,
    source_url: "https://openai.com/careers",
    metadata: {
      job_count: 15,
      departments: ["AI Research", "Platform Engineering"]
    }
  },
  {
    company_name: "Linear",
    signal_type: "office_opening",
    title: "Linear opens new San Francisco office",
    description: "Linear announced opening a 50-person office in San Francisco.",
    confidence_score: 8,
    source_url: "https://linear.app/blog/sf-office",
    metadata: {
      office_size: "50 people",
      location: "San Francisco, CA"
    }
  }
]

// Company lookup/creation function
async function findOrCreateCompany(companyName: string): Promise<string> {
  console.log(`🔍 Looking for company: ${companyName}`)
  
  // First, try to find existing company (case-insensitive)
  const { data: existingCompanies, error: searchError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName)
    .limit(1)

  if (searchError) {
    throw new Error(`Error searching for company ${companyName}: ${searchError.message}`)
  }

  if (existingCompanies && existingCompanies.length > 0) {
    console.log(`✅ Found existing company: ${existingCompanies[0].name} (${existingCompanies[0].id})`)
    return existingCompanies[0].id
  }

  console.log(`➕ Creating new company: ${companyName}`)
  
  // Company doesn't exist, create basic entry
  const basicCompanyData = {
    name: companyName.trim(),
    industry: 'Technology', // Default industry
    description: `Company profile for ${companyName}`
  }

  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert([basicCompanyData])
    .select('id, name')
    .single()

  if (insertError) {
    throw new Error(`Error creating company ${companyName}: ${insertError.message}`)
  }

  console.log(`✅ Created new company: ${newCompany.name} (${newCompany.id})`)
  return newCompany.id
}

// Create alerts for users tracking a company
async function createUserAlerts(companyId: string, signal: HiringSignalInsert): Promise<void> {
  try {
    console.log(`📢 Creating alerts for company: ${companyId}`)
    
    // Find all users tracking this company
    const { data: trackingUsers, error: trackingError } = await supabase
      .from('user_company_tracks')
      .select('user_id')
      .eq('company_id', companyId)

    if (trackingError) {
      console.error('Error fetching tracking users:', trackingError)
      return
    }

    if (!trackingUsers || trackingUsers.length === 0) {
      console.log('ℹ️  No users tracking this company')
      return
    }

    console.log(`📬 Creating ${trackingUsers.length} alerts`)

    // Create alerts for each tracking user
    const alertsToInsert = trackingUsers.map((track: { user_id: string }) => ({
      user_id: track.user_id,
      company_id: companyId,
      alert_type: 'hiring_signal',
      title: signal.title,
      message: signal.description,
      data: {
        signal_type: signal.signal_type,
        confidence_score: signal.confidence_score,
        source_url: signal.source_url,
        metadata: signal.metadata
      }
    }))

    const { error: alertInsertError } = await supabase
      .from('alerts')
      .insert(alertsToInsert)

    if (alertInsertError) {
      console.error('Error creating user alerts:', alertInsertError)
      return
    }

    console.log(`✅ Created ${alertsToInsert.length} alerts for users`)

  } catch (error: any) {
    console.error('Error creating user alerts:', error.message)
  }
}

// Main ingestion function
async function ingestHiringSignals(): Promise<void> {
  const startTime = new Date()
  console.log(`🚀 Starting hiring signal ingestion at ${startTime.toISOString()}`)
  console.log(`📥 Processing ${MOCK_SIGNAL_DATA.length} signals\n`)

  try {
    let processedSignals = 0
    let skippedSignals = 0
    let errors: string[] = []

    // Process each signal
    for (const signalData of MOCK_SIGNAL_DATA) {
      try {
        console.log(`\n📊 Processing: ${signalData.company_name} - ${signalData.title}`)

        // Step 1: Find or create company
        const companyId = await findOrCreateCompany(signalData.company_name)

        // Step 2: Check if signal already exists (avoid duplicates)
        const { data: existingSignals, error: signalSearchError } = await supabase
          .from('hiring_signals')
          .select('id')
          .eq('company_id', companyId)
          .eq('title', signalData.title)
          .limit(1)

        if (signalSearchError) {
          throw new Error(`Error checking existing signals: ${signalSearchError.message}`)
        }

        if (existingSignals && existingSignals.length > 0) {
          console.log(`⏭️  Signal already exists: ${signalData.title}`)
          skippedSignals++
          continue
        }

        // Step 3: Insert hiring signal
        const hiringSignal: HiringSignalInsert = {
          company_id: companyId,
          signal_type: signalData.signal_type,
          title: signalData.title,
          description: signalData.description,
          confidence_score: signalData.confidence_score || 5,
          source_url: signalData.source_url || undefined,
          detected_at: signalData.detected_at || new Date().toISOString(),
          metadata: signalData.metadata || undefined
        }

        const { error: signalInsertError } = await supabase
          .from('hiring_signals')
          .insert([hiringSignal])

        if (signalInsertError) {
          throw new Error(`Error inserting signal: ${signalInsertError.message}`)
        }

        console.log(`✅ Inserted signal: ${signalData.title}`)
        processedSignals++

        // Step 4: Create alerts for users tracking this company
        await createUserAlerts(companyId, hiringSignal)

      } catch (error: any) {
        console.error(`❌ Error processing signal for ${signalData.company_name}:`, error.message)
        errors.push(`${signalData.company_name}: ${error.message}`)
      }
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    console.log(`\n🎉 Ingestion completed in ${duration}ms`)
    console.log(`📊 Results:`)
    console.log(`   • Processed: ${processedSignals} new signals`)
    console.log(`   • Skipped: ${skippedSignals} duplicates`)
    console.log(`   • Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log(`\n🔴 Errors encountered:`)
      errors.forEach(error => console.log(`   • ${error}`))
    }

  } catch (error: any) {
    console.error('💥 Fatal error in hiring signal ingestion:', error.message)
    throw error
  }
}

// Manual run function (for testing)
async function runManualIngestion(): Promise<void> {
  try {
    console.log('🧪 Running manual signal ingestion...\n')
    await ingestHiringSignals()
    console.log('\n✅ Manual ingestion completed successfully')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Manual ingestion failed:', error.message)
    process.exit(1)
  }
}

// Cron job scheduler
function startCronJobs(): void {
  console.log('📅 Setting up cron jobs...')
  
  // Run every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('\n⏰ Cron job triggered: Starting signal ingestion')
    try {
      await ingestHiringSignals()
    } catch (error: any) {
      console.error('Cron job failed:', error.message)
    }
  })

  console.log('✅ Cron jobs started:')
  console.log('   • Full ingestion: Every 4 hours (0 */4 * * *)')
  console.log('   • Press Ctrl+C to stop\n')
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  console.log('🤖 EarlyJob Alerts - Signal Ingestion Service')
  console.log('==========================================\n')
  
  if (args.includes('--manual') || args.includes('-m')) {
    // Run once and exit
    await runManualIngestion()
  } else {
    // Start cron jobs
    console.log('🚀 Starting automated signal ingestion service...')
    
    // Run initial ingestion
    try {
      await ingestHiringSignals()
      console.log('\n✅ Initial ingestion completed')
    } catch (error: any) {
      console.error('\n❌ Initial ingestion failed:', error.message)
    }
    
    // Start scheduled jobs
    startCronJobs()
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down signal ingestion service...')
      process.exit(0)
    })
    
    // Keep alive
    setInterval(() => {
      console.log(`⏰ Service running... ${new Date().toLocaleTimeString()}`)
    }, 60000) // Log every minute to show it's alive
  }
}

// Export functions for use in other modules
module.exports = {
  ingestHiringSignals,
  findOrCreateCompany,
  createUserAlerts
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Service failed to start:', error.message)
    process.exit(1)
  })
}