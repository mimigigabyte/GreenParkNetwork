import { NextRequest, NextResponse } from 'next/server'
// Try the standard import pattern
import { v2 as translateV2 } from '@google-cloud/translate'

export const dynamic = 'force-dynamic'

// Initialize Google Cloud Translation client
let translate: any = null
try {
  // Use API key authentication instead of service account file
  translate = new translateV2.Translate({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Use as API key instead of file path
  })
  console.log('✅ Google Cloud Translate client initialized successfully with API key')
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Translate client:', error)
}

async function translateToChinese(text: string): Promise<string> {
  if (!text) return ''
  
  const originalText = text.trim()
  console.log(`🔄 Attempting translation with Google Cloud: "${originalText.slice(0, 50)}..."`)
  
  // Check if Google Cloud client is available
  if (!translate) {
    console.warn('⚠️ Google Cloud Translate client not available, using fallback')
  } else {
    try {
      // Use Google Cloud Translation API
      console.log('🌐 Calling Google Cloud Translate API...')
      const [translation] = await translate.translate(originalText, {
        from: 'en',
        to: 'zh-cn'
      })
      
      if (translation && translation.trim()) {
        const translated = translation.trim()
        console.log(`✅ Google Cloud Translation SUCCESS: "${translated.slice(0, 50)}..."`)
        return translated
      } else {
        console.warn('⚠️ Google Cloud API returned empty translation')
      }
    } catch (error) {
      console.error(`❌ Google Cloud Translation API error:`, error)
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code,
        status: (error as any)?.status
      })
    }
  }
  
  // Fallback: Simple word-by-word translation for common technical terms
  const simpleTranslations: {[key: string]: string} = {
    'Description': '技术描述',
    'Benefits': '收益类型', 
    'Benefits Description': '收益描述',
    'Benefit Types': '收益类型',
    'Benefit Details': '收益描述',
    'Deployed In': '应用地区和国家',
    'Technology Readiness Level': '技术成熟度',
    'wind': '风能',
    'energy': '能源',
    'power': '电力',
    'technology': '技术',
    'system': '系统',
    'efficiency': '效率',
    'cost': '成本',
    'environmental': '环境',
    'sustainable': '可持续',
    'renewable': '可再生'
  }
  
  let fallbackTranslation = originalText
  for (const [en, zh] of Object.entries(simpleTranslations)) {
    fallbackTranslation = fallbackTranslation.replace(new RegExp(en, 'gi'), zh)
  }
  
  if (fallbackTranslation !== originalText) {
    console.log(`🔤 Simple translation: "${fallbackTranslation.slice(0, 50)}..."`)
    return fallbackTranslation
  }
  
  console.log(`⚠️ No translation available, keeping original: "${originalText.slice(0, 50)}..."`)
  return originalText
}

function toNormalizedString(val: any): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.filter(Boolean).map(v => (v == null ? '' : String(v))).join(', ')
  try { return String(val) } catch { return '' }
}

async function translateMultilineToChinese(text: string): Promise<string> {
  if (!text) return ''
  
  console.log(`🚀 FORCE TRANSLATING ALL CONTENT with Google Cloud - length: ${text.length}`)
  console.log(`Original text preview: "${text.slice(0, 200)}..."`)
  
  const lines = text.split(/\r?\n/)
  const out: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (!ln.trim()) { 
      out.push('')
      continue 
    }
    
    console.log(`Translating line ${i + 1}/${lines.length}: "${ln.slice(0, 100)}..."`)
    
    // FORCE translate every line using Google Cloud Translation
    const zh = await translateToChinese(ln)
    out.push(zh) // Always use translation result
    
    console.log(`Result: "${zh.slice(0, 100)}..."`)
    
    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 100))
  }
  
  const result = out.join('\n')
  console.log(`✨ Final translated result preview: "${result.slice(0, 200)}..."`)
  return result
}

function composeEnglish(item: any) {
  const parts = [] as string[]
  const desc = toNormalizedString(item.description)
  const benefitsStr = toNormalizedString(item.benefits)
  const benefitsDescStr = toNormalizedString(item.benefitsDescription)
  parts.push(`Description: ${desc}`)
  const types = /NO QUERY SPECIFIED/i.test(benefitsStr) ? '' : benefitsStr
  parts.push(`Benefit Types: ${types}`)
  parts.push(`Benefit Details: ${benefitsDescStr}`)
  const deployed = Array.isArray(item.deployedInCountry) ? item.deployedInCountry.join(', ') : toNormalizedString(item.deployedInCountry)
  parts.push(`Deployed In: ${deployed}`)
  parts.push(`Technology Readiness Level: ${item.technologyReadinessLevel || ''}`)
  parts.push(`ID: ${item.id || ''}`)
  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = body?.item || {}
    const english = composeEnglish(item)
    
    // Validate scraped content before translation
    const descStr = toNormalizedString(item.description)
    const benefitsStr = toNormalizedString(item.benefits)
    const benefitsDescStr = toNormalizedString(item.benefitsDescription)
    const hasDescription = Boolean(descStr.trim())
    const hasBenefits = Boolean(benefitsStr.trim())
    const hasBenefitsDescription = Boolean(benefitsDescStr.trim())
    
    console.log('Processing item with ID:', item.id || 'unknown')
    console.log('Content validation:', {
      hasDescription,
      hasBenefits, 
      hasBenefitsDescription,
      descLength: descStr.length,
      benefitsLength: benefitsStr.length,
      benefitsDescLength: benefitsDescStr.length
    })

    // Translation with validation and fallbacks
    let zhDesc = ''
    if (hasDescription) {
      zhDesc = await translateMultilineToChinese(descStr)
      if (!zhDesc) {
        console.warn('Translation failed for description, using original')
        zhDesc = descStr
      }
    } else {
      console.warn('No description content found for translation')
    }
    
    let zhTypes = ''
    if (hasBenefits) {
      zhTypes = await translateMultilineToChinese(benefitsStr)
      if (!zhTypes) {
        console.warn('Translation failed for benefits, using original')
        zhTypes = benefitsStr
      }
    } else {
      console.warn('No benefits content found for translation')
    }
    
    let zhDetails = ''
    if (hasBenefitsDescription) {
      zhDetails = await translateMultilineToChinese(benefitsDescStr)
      if (!zhDetails) {
        console.warn('Translation failed for benefits description, using original')
        zhDetails = benefitsDescStr
      }
    } else {
      console.warn('No benefits description content found for translation')
    }
    
    const deployedText = Array.isArray(item.deployedInCountry) ? item.deployedInCountry.join(', ') : (item.deployedInCountry || '')
    let zhDeployedRaw = ''
    if (deployedText.trim()) {
      zhDeployedRaw = await translateMultilineToChinese(deployedText)
      if (!zhDeployedRaw) zhDeployedRaw = deployedText
    }
    let zhDeployed = zhDeployedRaw.replace(/全局/g, '全球').replace(/Global/gi, '全球')
    
    let zhTrl = ''
    if (item.technologyReadinessLevel && item.technologyReadinessLevel.trim()) {
      if ((item.technologyReadinessLevel || '').toLowerCase().includes('scaling up') && /(trl\s*9)/i.test(item.technologyReadinessLevel || '')) {
        zhTrl = '扩大生产阶段（技术成熟度9级）'
      } else {
        zhTrl = await translateMultilineToChinese(item.technologyReadinessLevel)
        if (!zhTrl) zhTrl = item.technologyReadinessLevel
      }
    }
    
    const chinese = [
      `技术描述：${zhDesc}`,
      `收益类型：${zhTypes}`,
      `收益描述：${zhDetails}`,
      `应用地区和国家：${zhDeployed}`,
      `技术成熟度：${zhTrl}`,
      `ID：${item.id || ''}`
    ].join('\n')
    
    console.log('Translation completed for ID:', item.id || 'unknown')
    console.log('Chinese content lengths:', {
      zhDesc: zhDesc.length,
      zhTypes: zhTypes.length,
      zhDetails: zhDetails.length
    })
    
    return NextResponse.json({ success: true, data: { description_en: english, description_zh: chinese } })
  } catch (e: any) {
    console.error('Process route error:', e)
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
