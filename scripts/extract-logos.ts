/**
 * Extract SVG from HTML logo files and convert to proper formats
 * Run with: npx tsx scripts/extract-logos.ts
 */

import fs from 'fs'
import path from 'path'
import { parse } from 'node-html-parser'

const BRAND_ASSETS_DIR = path.join(process.cwd(), 'brand-assets')
const OUTPUT_DIR = path.join(BRAND_ASSETS_DIR, 'logos')

// Create output directories
const dirs = [
  path.join(OUTPUT_DIR, 'icon'),
  path.join(OUTPUT_DIR, 'wordmark'),
  path.join(OUTPUT_DIR, 'lockup'),
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

async function extractLogosFromHTML() {
  console.log('🔍 Looking for HTML logo files in brand-assets...\n')

  // Find all HTML files in brand-assets
  const files = fs.readdirSync(BRAND_ASSETS_DIR)
  const htmlFiles = files.filter(f => f.endsWith('.html'))

  if (htmlFiles.length === 0) {
    console.log('❌ No HTML files found in brand-assets/')
    console.log('\nPlease:')
    console.log('1. Save your logo HTML files to the brand-assets/ folder')
    console.log('2. Run this script again: npx tsx scripts/extract-logos.ts')
    return
  }

  console.log(`Found ${htmlFiles.length} HTML file(s):\n`)

  for (const htmlFile of htmlFiles) {
    console.log(`📄 Processing: ${htmlFile}`)
    const filePath = path.join(BRAND_ASSETS_DIR, htmlFile)
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse HTML
    const root = parse(htmlContent)
    
    // Find all SVG elements
    const svgs = root.querySelectorAll('svg')
    
    if (svgs.length === 0) {
      console.log(`   ⚠️  No SVG elements found\n`)
      continue
    }

    console.log(`   ✓ Found ${svgs.length} SVG element(s)`)

    svgs.forEach((svg, index) => {
      const svgContent = svg.toString()
      
      // Determine output filename based on HTML filename
      const baseName = path.basename(htmlFile, '.html')
      const outputName = svgs.length > 1 
        ? `${baseName}-${index + 1}.svg`
        : `${baseName}.svg`
      
      // Determine which folder based on filename patterns
      let outputFolder = OUTPUT_DIR
      if (baseName.includes('icon') || baseName.includes('square')) {
        outputFolder = path.join(OUTPUT_DIR, 'icon')
      } else if (baseName.includes('word') || baseName.includes('horizontal')) {
        outputFolder = path.join(OUTPUT_DIR, 'wordmark')
      } else if (baseName.includes('lockup') || baseName.includes('vertical')) {
        outputFolder = path.join(OUTPUT_DIR, 'lockup')
      }

      const outputPath = path.join(outputFolder, outputName)
      fs.writeFileSync(outputPath, svgContent)
      
      console.log(`   ✅ Extracted: ${path.relative(BRAND_ASSETS_DIR, outputPath)}`)
    })
    
    console.log()
  }

  console.log('\n🎉 Logo extraction complete!')
  console.log('\n📁 Check these folders:')
  console.log('   - brand-assets/logos/icon/')
  console.log('   - brand-assets/logos/wordmark/')
  console.log('   - brand-assets/logos/lockup/')
  console.log('\n💡 Next steps:')
  console.log('   1. Review the extracted SVG files')
  console.log('   2. Rename files if needed (e.g., icon.svg, wordmark-light.svg)')
  console.log('   3. Generate PNG versions using: npx tsx scripts/convert-svg-to-png.ts')
}

// Additional: Extract any embedded PNG/images
function extractImages(htmlContent: string, htmlFile: string) {
  const imgPattern = /<img[^>]+src="([^"]+)"/gi
  const matches = [...htmlContent.matchAll(imgPattern)]
  
  matches.forEach((match, index) => {
    const src = match[1]
    if (src.startsWith('data:image')) {
      // Base64 image
      const [metadata, base64] = src.split(',')
      const mimeType = metadata.match(/data:image\/([^;]+)/)?.[1] || 'png'
      const baseName = path.basename(htmlFile, '.html')
      const outputName = `${baseName}-${index + 1}.${mimeType}`
      const outputPath = path.join(OUTPUT_DIR, 'icon', outputName)
      
      const buffer = Buffer.from(base64, 'base64')
      fs.writeFileSync(outputPath, buffer)
      console.log(`   ✅ Extracted image: ${outputName}`)
    }
  })
}

extractLogosFromHTML().catch(console.error)
