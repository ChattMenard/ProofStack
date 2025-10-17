/**
 * Simple script to help convert HTML logo files to SVG
 * Run with: npx tsx scripts/extract-logos-simple.ts
 */

import fs from 'fs'
import path from 'path'

const BRAND_ASSETS_DIR = path.join(process.cwd(), 'brand-assets')
const OUTPUT_DIR = path.join(BRAND_ASSETS_DIR, 'logos')

// Create output directories
function createDirs() {
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'icon'),
    path.join(OUTPUT_DIR, 'wordmark'),
    path.join(OUTPUT_DIR, 'lockup'),
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✓ Created: ${path.relative(process.cwd(), dir)}`)
    }
  })
}

async function extractLogos() {
  console.log('🔍 Looking for HTML logo files...\n')

  // Find all HTML files
  const files = fs.readdirSync(BRAND_ASSETS_DIR)
  const htmlFiles = files.filter(f => f.endsWith('.html'))

  if (htmlFiles.length === 0) {
    console.log('❌ No HTML files found in brand-assets/')
    console.log('\nUsage:')
    console.log('1. Save your logo HTML files to brand-assets/')
    console.log('2. Run: npx tsx scripts/extract-logos-simple.ts')
    console.log('\nOr manually extract SVG:')
    console.log('1. Open the HTML file in a browser')
    console.log('2. Right-click the logo → Inspect')
    console.log('3. Find the <svg> element')
    console.log('4. Copy the entire <svg>...</svg> content')
    console.log('5. Save as .svg file in brand-assets/logos/')
    return
  }

  createDirs()
  console.log()

  for (const htmlFile of htmlFiles) {
    console.log(`📄 ${htmlFile}`)
    const filePath = path.join(BRAND_ASSETS_DIR, htmlFile)
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    
    // Simple regex to find SVG tags
    const svgMatches = htmlContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi)
    
    if (!svgMatches) {
      console.log(`   ⚠️  No <svg> tags found`)
      console.log(`   💡 Try opening ${htmlFile} in VS Code to see the content\n`)
      continue
    }

    console.log(`   ✓ Found ${svgMatches.length} SVG(s)`)

    svgMatches.forEach((svgContent, index) => {
      const baseName = path.basename(htmlFile, '.html')
      const suffix = svgMatches.length > 1 ? `-${index + 1}` : ''
      
      // Determine folder
      let folder = 'icon'
      if (baseName.toLowerCase().includes('word')) {
        folder = 'wordmark'
      } else if (baseName.toLowerCase().includes('lockup') || baseName.toLowerCase().includes('vertical')) {
        folder = 'lockup'
      }

      const outputName = `${baseName}${suffix}.svg`
      const outputPath = path.join(OUTPUT_DIR, folder, outputName)
      
      fs.writeFileSync(outputPath, svgContent)
      console.log(`   ✅ Saved: logos/${folder}/${outputName}`)
    })
    
    console.log()
  }

  console.log('🎉 Done! Check brand-assets/logos/')
  console.log('\n📋 Next steps:')
  console.log('   1. Review the SVG files')
  console.log('   2. Rename as needed (e.g., icon.svg, wordmark-dark.svg)')
  console.log('   3. Copy key files to public/ for use in the app')
}

extractLogos().catch(console.error)
