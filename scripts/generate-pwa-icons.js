#!/usr/bin/env node
/**
 * Generate PWA icons from logo.svg
 * Run: node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputSvg = path.join(__dirname, '../public/logo.svg')
const outputDir = path.join(__dirname, '../public')

// Check if logo.svg exists
if (!fs.existsSync(inputSvg)) {
  console.error('❌ Error: logo.svg not found in public/ directory')
  process.exit(1)
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons from logo.svg...\n')

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`)
    
    try {
      await sharp(inputSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 58, b: 42, alpha: 1 } // forest-950
        })
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Generated icon-${size}.png`)
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}.png:`, error.message)
    }
  }

  // Generate favicon.ico
  try {
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'))
    console.log('✅ Generated favicon.png')
  } catch (error) {
    console.error('❌ Failed to generate favicon.png:', error.message)
  }

  console.log('\n✨ Icon generation complete!')
  console.log('📱 Icons are ready for PWA and Google Play submission\n')
}

generateIcons().catch((error) => {
  console.error('❌ Icon generation failed:', error)
  process.exit(1)
})
