import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body?.id || '').trim()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const url = `https://wipogreen.wipo.int/wipogreen-database/articles/${id}`

    const proc = spawn(process.execPath, ['scripts/playwright/scrape-wipo-article.js', url], { env: process.env })
    let out = ''
    let err = ''
    await new Promise<void>((resolve, reject) => {
      proc.stdout.on('data', (d) => out += d.toString())
      proc.stderr.on('data', (d) => err += d.toString())
      proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(err || `exit ${code}`)))
    })
    const jsonStart = out.lastIndexOf('{')
    const json = jsonStart >= 0 ? JSON.parse(out.slice(jsonStart)) : null
    return NextResponse.json({ success: true, data: json })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

