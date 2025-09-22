import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { v2 as translateV2 } from '@google-cloud/translate'

export const dynamic = 'force-dynamic'

// Initialize Google Cloud Translation client
let translate: any = null
try {
  translate = new translateV2.Translate({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  })
  console.log('✅ Google Cloud Translate client initialized for scrape+process workflow')
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Translate client:', error)
}

async function translateToChinese(text: string): Promise<string> {
  if (!text) return ''
  
  const originalText = text.trim()
  
  if (!translate) {
    console.warn('⚠️ Google Cloud Translate client not available, using fallback')
  } else {
    try {
      const [translation] = await translate.translate(originalText, {
        from: 'en',
        to: 'zh-cn'
      })
      
      if (translation && translation.trim()) {
        return translation.trim()
      }
    } catch (error) {
      console.error(`❌ Google Cloud Translation API error:`, error)
    }
  }
  
  // Fallback translations
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
  
  return fallbackTranslation !== originalText ? fallbackTranslation : originalText
}

function toNormalizedString(val: any): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.filter(Boolean).map(v => (v == null ? '' : String(v))).join(', ')
  try { return String(val) } catch { return '' }
}

async function translateMultilineToChinese(text: string): Promise<string> {
  if (!text) return ''
  
  const lines = text.split(/\r?\n/)
  const out: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (!ln.trim()) { 
      out.push('')
      continue 
    }
    
    const zh = await translateToChinese(ln)
    out.push(zh)
    
    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 100))
  }
  
  return out.join('\n')
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

async function processTranslation(item: any, logger: (message: string, meta?: any) => void = () => {}) {
  const log = (message: string, meta?: any) => {
    logger(message, meta)
    console.log(message, meta ?? '')
  }

  log(`📝 正在处理数据 ID=${item.id}`)
  
  const english = composeEnglish(item)
  
  // Validate scraped content
  const descStr = toNormalizedString(item.description)
  const benefitsStr = toNormalizedString(item.benefits)
  const benefitsDescStr = toNormalizedString(item.benefitsDescription)
  const hasDescription = Boolean(descStr.trim())
  const hasBenefits = Boolean(benefitsStr.trim())
  const hasBenefitsDescription = Boolean(benefitsDescStr.trim())
  
  log(`🔍 内容验证 ID=${item.id}`, {
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
      log(`⚠️ 描述翻译失败 ID=${item.id}, 使用原文`)
      zhDesc = descStr
    }
  }
  
  let zhTypes = ''
  if (hasBenefits) {
    zhTypes = await translateMultilineToChinese(benefitsStr)
    if (!zhTypes) {
      log(`⚠️ 收益类型翻译失败 ID=${item.id}, 使用原文`)
      zhTypes = benefitsStr
    }
  }
  
  let zhDetails = ''
  if (hasBenefitsDescription) {
    zhDetails = await translateMultilineToChinese(benefitsDescStr)
    if (!zhDetails) {
      log(`⚠️ 收益描述翻译失败 ID=${item.id}, 使用原文`)
      zhDetails = benefitsDescStr
    }
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
    if ((item.technologyReadinessLevel || '').toLowerCase().includes('scaling up') && /(trl\\s*9)/i.test(item.technologyReadinessLevel || '')) {
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
  
  log(`✅ 翻译完成 ID=${item.id}`)

  return { description_en: english, description_zh: chinese }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body?.id || '').trim()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    
    console.log(`🚀 开始抓取+处理工作流 ID=${id}`)
    const aggregatedLogs: string[] = []
    
    // Step 1: 抓取数据
    console.log(`🕷️ 正在抓取 ID=${id}`)
    const url = `https://wipogreen.wipo.int/wipogreen-database/articles/${id}`
    
    const proc = spawn(process.execPath, ['scripts/playwright/scrape-wipo-article.js', url], { env: process.env })
    let out = ''
    let err = ''
    await new Promise<void>((resolve, reject) => {
      proc.stdout.on('data', (d) => {
        const chunk = d.toString()
        out += chunk
        chunk.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim()
          if (trimmed) aggregatedLogs.push(trimmed)
        })
      })
      proc.stderr.on('data', (d) => {
        const chunk = d.toString()
        err += chunk
        chunk.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim()
          if (trimmed) aggregatedLogs.push(`stderr: ${trimmed}`)
        })
      })
      proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(err || `exit ${code}`)))
    })
    
    const jsonStart = out.lastIndexOf('{')
    const scrapedData = jsonStart >= 0 ? JSON.parse(out.slice(jsonStart)) : null

    if (!scrapedData) {
      throw new Error('抓取数据失败：未获取到有效数据')
    }

    console.log(`✅ 抓取完成 ID=${id}`)

    const cleanedScrapeLogs = aggregatedLogs.filter((line: string) => {
      if (!line) return false
      const t = line.trim()
      if (!t) return false
      if (t.startsWith('{') || t.startsWith('}')) return false
      if (/^".+":/.test(t)) return false
      return true
    })
    
    // Step 2: 处理和翻译数据（不自动导入）
    const translatedLogs: string[] = []
    const logger = (message: string, meta?: any) => {
      const formatted = meta ? `${message} ${JSON.stringify(meta)}` : message
      translatedLogs.push(formatted)
    }
    const translatedData = await processTranslation(scrapedData, logger)
    
    console.log(`✅ 处理完成 ID=${id} - 等待人工验证后批量导入`)
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...scrapedData,
        description_en: translatedData.description_en,
        description_zh: translatedData.description_zh,
        processed: true  // 标记为已处理，但未导入
      },
      logs: [...cleanedScrapeLogs, ...translatedLogs],
      message: `ID=${id} 抓取和处理完成，请验证后批量导入`
    })
    
  } catch (e: any) {
    console.error(`❌ 抓取+处理失败:`, e)
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
