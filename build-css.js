import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

async function buildCSS() {
  try {
    const css = await readFile('./app/styles/globals.css', 'utf8')
    
    const result = await postcss([
      tailwindcss,
      autoprefixer
    ]).process(css, {
      from: './app/styles/globals.css',
      to: './public/styles/globals.css'
    })
    
    await mkdir('./public/styles', { recursive: true })
    await writeFile('./public/styles/globals.css', result.css)
    
    if (result.map) {
      await writeFile('./public/styles/globals.css.map', result.map.toString())
    }
    
    console.log('✅ CSS built successfully')
  } catch (error) {
    console.error('❌ CSS build failed:', error)
    process.exit(1)
  }
}

buildCSS()
