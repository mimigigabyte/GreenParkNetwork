'use client'

import { useState, useEffect } from 'react'

type WipoItem = {
  id: string
  technologyNameEN?: string
  technologyNameCN?: string
  companyName?: string
  technologyImageUrl?: string
  companyWebsiteUrl?: string
  description?: string
  benefits?: string
  benefitsDescription?: string
  developedInCountry?: string
  deployedInCountry?: string[] | string
  technologyReadinessLevel?: string
  customLabels?: string[]
}

export default function WipoScraperPage() {
  const [idsInput, setIdsInput] = useState('')
  const [intervalSec, setIntervalSec] = useState(1) // seconds
  const [items, setItems] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [subcategoryId, setSubcategoryId] = useState<string>('')
  const [batchImporting, setBatchImporting] = useState(false)
  const [failedIds, setFailedIds] = useState<string[]>([])
  const [onDuplicate, setOnDuplicate] = useState<'prompt'|'skip'|'overwrite'>('prompt')
  const [dupModalOpen, setDupModalOpen] = useState(false)
  const [dupOld, setDupOld] = useState<any|null>(null)
  const [dupNew, setDupNew] = useState<any|null>(null)
  const [dupResolve, setDupResolve] = useState<((v:'skip'|'overwrite')=>void)|null>(null)

  const parseIds = (text: string) => Array.from(new Set(text.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)))

  // 抓取+处理工作流（不自动导入）
  const handleScrapeAndProcess = async () => {
    const ids = parseIds(idsInput)
    if (!ids.length) return alert('请输入至少一个技术ID')
    setProcessing(true)
    setPaused(false)
    setProgress(0)
    const started = Date.now()
    setLogs(prev => [...prev, `🚀 开始抓取+处理工作流，共 ${ids.length} 条，间隔 ${intervalSec}s ...`])
    
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      // 支持暂停/继续
      while (paused) {
        await new Promise(r => setTimeout(r, 200))
      }
      try {
        const ac = new AbortController()
        const to = setTimeout(() => ac.abort(), 180000) // 3 minutes timeout for scrape+process
        
        setLogs(prev => [...prev, `🕷️ 正在抓取 ID=${id} (${i+1}/${ids.length})`])
        
        const res = await fetch('/api/admin/wipo-scraper/complete', { 
          method: 'POST', 
          body: JSON.stringify({ id }), 
          headers: { 'Content-Type': 'application/json' }, 
          signal: ac.signal 
        })
        clearTimeout(to)
        
        const data = await res.json()
        if (data?.success) {
          setItems(prev => [...prev, data.data])
          setLogs(prev => [...prev, `✅ 完成 ID=${id} - 抓取和处理成功，等待验证后导入`])
        } else {
          setLogs(prev => [...prev, `❌ 失败 ID=${id}：${data?.error || res.statusText}`])
          setFailedIds(prev => Array.from(new Set([...prev, String(id)])))
        }
      } catch (e: any) {
        setLogs(prev => [...prev, `❌ 异常 ID=${id}：${e?.message || String(e)}`])
        setFailedIds(prev => Array.from(new Set([...prev, String(id)])))
      }
      setProgress(Math.round(((i+1)/ids.length)*100))
      if (i !== ids.length-1) await new Promise(r => setTimeout(r, Math.max(0, intervalSec)*1000))
    }
    const elapsed = Math.round((Date.now()-started)/1000)
    setLogs(prev => [...prev, `🎉 抓取+处理工作流完成，用时 ${elapsed}s，请验证数据后点击批量导入`])
    setProcessing(false)
  }

  const handleScrapeBatch = async () => {
    const ids = parseIds(idsInput)
    if (!ids.length) return alert('请输入至少一个技术ID')
    setProcessing(true)
    setPaused(false)
    setProgress(0)
    const results: any[] = []
    const started = Date.now()
    setLogs(prev => [...prev, `开始批量抓取，共 ${ids.length} 条，间隔 ${intervalSec}s ...`])
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      while (paused) { await new Promise(r => setTimeout(r, 200)) }
      try {
        // fetch with client-side timeout guard
        const ac = new AbortController()
        const to = setTimeout(() => ac.abort(), 60000)
        const res = await fetch('/api/admin/wipo-scraper/scrape', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' }, signal: ac.signal })
        clearTimeout(to)
        const data = await res.json()
        if (data?.data) {
          results.push(data.data)
          setItems(prev => [...prev, data.data])
          setLogs(prev => [...prev, `抓取成功 ID=${id}`])
        } else {
          setLogs(prev => [...prev, `抓取失败 ID=${id}：${data?.error || res.statusText}`])
          setFailedIds(prev => Array.from(new Set([...prev, String(id)])))
        }
      } catch (e: any) {
        setLogs(prev => [...prev, `抓取异常 ID=${id}：${e?.message || String(e)}`])
        setFailedIds(prev => Array.from(new Set([...prev, String(id)])))
      }
      setProgress(Math.round(((i+1)/ids.length)*100))
      if (i !== ids.length-1) await new Promise(r => setTimeout(r, Math.max(0, intervalSec)*1000))
    }
    const elapsed = Math.round((Date.now()-started)/1000)
    setLogs(prev => [...prev, `批量抓取完成，用时 ${elapsed}s`])
    setProcessing(false)
  }

  const handleCsv = async (file: File) => {
    const text = await file.text()
    const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean)
    const ids = lines.slice(1).map(l => (l.split(',')[0]||'').trim()).filter(Boolean)
    setIdsInput(ids.join(','))
  }

  const compose = async (idx: number) => {
    const item = items[idx]
    const res = await fetch('/api/admin/wipo-scraper/process', { method: 'POST', body: JSON.stringify({ item }), headers: { 'Content-Type': 'application/json' } })
    const j = await res.json()
    if (j?.data) {
      const next = items.slice()
      next[idx] = { ...next[idx], ...j.data }
      setItems(next)
    }
  }

  const handleImport = async (idx: number) => {
    const item = items[idx]
    if (!categoryId || !subcategoryId) {
      alert('请先选择技术类型和子分类')
      return
    }
    try {
      // 先检查是否存在重复
      const check = await fetch(`/api/admin/wipo-scraper/check-existing?id=${encodeURIComponent(item.id)}`)
      const cj = await check.json()
      let onDup: 'skip'|'overwrite' = 'overwrite'
      if (cj?.exists) {
        // 展示双列对比弹窗
        const decision = await new Promise<'skip'|'overwrite'>((resolve) => {
          setDupOld(cj.record)
          setDupNew({ ...item, category_id: categoryId, subcategory_id: subcategoryId })
          setDupResolve(() => resolve)
          setDupModalOpen(true)
        })
        onDup = decision
        if (onDup === 'skip') {
          alert(`已跳过: ${item.id}`)
          return
        }
      }
      const res = await fetch('/api/admin/wipo-scraper/import', { 
        method: 'POST', 
        body: JSON.stringify({ 
          item, 
          description_en: item.description_en, 
          description_zh: item.description_zh, 
          category_id: categoryId, 
          subcategory_id: subcategoryId,
          onDuplicate: onDup
        }),
        headers: { 'Content-Type': 'application/json' } 
      })
      const j = await res.json()
      if (j?.success) alert(j?.skipped ? `已跳过: ${item.id}` : `导入成功: ${item.id}`)
      else alert(j?.error || '导入失败')
    } catch (e: any) {
      alert(`导入异常: ${e?.message || String(e)}`)
    }
  }

  // load categories
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/public/categories')
      const list = await res.json()
      setCategories(Array.isArray(list) ? list : [])
    } catch {}
  }
  const loadSubcategories = async (cid: string) => {
    setSubcategories([]); setSubcategoryId('')
    if (!cid) return
    try {
      const res = await fetch(`/api/admin/subcategories?category_id=${cid}`)
      const list = await res.json()
      setSubcategories(Array.isArray(list) ? list : [])
    } catch {}
  }

  // init
  useEffect(() => { loadCategories() }, [])

  // export processed items as JSON
  // 批量导入已处理数据到数据库
  const handleBatchImport = async () => {
    if (!items.length) {
      alert('没有可导入的数据')
      return
    }
    
    const processedItems = items.filter(item => item.description_en && item.description_zh && !item.imported)
    if (!processedItems.length) {
      alert('没有待导入的数据，请先抓取+处理数据，或检查是否已全部导入')
      return
    }
    
    setBatchImporting(true)
    setPaused(false)
    setProgress(0)
    setLogs(prev => [...prev, `📦 开始批量导入 ${processedItems.length} 条已处理数据（逐条导入，实时进度）...`])

    try {
      for (let i = 0; i < processedItems.length; i++) {
        const it = processedItems[i]
        // 支持暂停/继续
        while (paused) { await new Promise(r => setTimeout(r, 200)) }
        try {
          let decision: 'skip'|'overwrite' = onDuplicate === 'prompt' ? 'overwrite' : (onDuplicate as any)
          if (onDuplicate === 'prompt') {
            // 逐条检查并弹窗
            const r = await fetch(`/api/admin/wipo-scraper/check-existing?id=${encodeURIComponent(it.id)}`)
            const j = await r.json()
            if (j?.exists) {
              decision = await new Promise<'skip'|'overwrite'>((resolve) => {
                setDupOld(j.record)
                setDupNew({ ...it, category_id: categoryId, subcategory_id: subcategoryId })
                setDupResolve(() => resolve)
                setDupModalOpen(true)
              })
              if (decision === 'skip') {
                setLogs(prev => [...prev, `⏭️ 已跳过（重复） ID=${it.id}`])
                setProgress(Math.round(((i+1)/processedItems.length)*100))
                continue
              }
            }
          }

          setLogs(prev => [...prev, `➡️ 导入中 (${i+1}/${processedItems.length}) ID=${it.id}`])
          const res = await fetch('/api/admin/wipo-scraper/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item: it,
              description_en: it.description_en,
              description_zh: it.description_zh,
              category_id: categoryId,
              subcategory_id: subcategoryId,
              onDuplicate: decision
            })
          })
          const j2 = await res.json()
          if (j2?.success) {
            setLogs(prev => [...prev, `✅ 导入成功 ID=${it.id}`])
            setItems(prev => prev.map(v => v.id === it.id ? { ...v, imported: true } : v))
          } else {
            setLogs(prev => [...prev, `❌ 导入失败 ID=${it.id}: ${j2?.error || res.statusText}`])
          }
        } catch (e: any) {
          setLogs(prev => [...prev, `❌ 导入异常 ID=${it.id}: ${e?.message || String(e)}`])
        }
        setProgress(Math.round(((i+1)/processedItems.length)*100))
        await new Promise(r => setTimeout(r, 80))
      }
      setLogs(prev => [...prev, '🎉 批量导入完成（逐条导入）'])
    } catch (e: any) {
      setLogs(prev => [...prev, `❌ 批量导入异常: ${e?.message || String(e)}`])
    }

    setBatchImporting(false)
  }

  // 导入JSON文件
  const handleImportJSON = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.items && Array.isArray(data.items)) {
        setItems(prev => [...prev, ...data.items])
        setLogs(prev => [...prev, `📥 导入JSON文件成功: ${data.items.length} 条记录`])
        
        // 如果JSON中有分类信息，自动设置
        if (data.category_id) setCategoryId(data.category_id)
        if (data.subcategory_id) setSubcategoryId(data.subcategory_id)
      } else {
        alert('JSON文件格式不正确，需要包含 items 数组')
      }
    } catch (e: any) {
      alert(`导入JSON失败: ${e?.message || String(e)}`)
    }
  }

  const handleExportJSON = () => {
    if (!items.length) {
      alert('没有可导出的数据');
      return;
    }
    const mapItem = (it: any) => ({
      id: it.id,
      technologyNameEN: it.technologyNameEN || '',
      technologyNameCN: it.technologyNameCN || '',
      companyName: it.companyName || '',
      companyWebsiteUrl: it.companyWebsiteUrl || '',
      technologyImageUrl: it.technologyImageUrl || '',
      description_en: it.description_en || '',
      description_zh: it.description_zh || '',
      benefits: it.benefits || '',
      benefitsDescription: it.benefitsDescription || '',
      developedInCountry: it.developedInCountry || '',
      deployedInCountry: it.deployedInCountry || '',
      technologyReadinessLevel: it.technologyReadinessLevel || '',
      customLabels: it.customLabels || [],
    })
    const payload = {
      exportedAt: new Date().toISOString(),
      count: items.length,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      items: items.map(mapItem)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wipo-processed-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* 重复对比弹窗 */}
      <DuplicateCompareModal 
        open={dupModalOpen} 
        oldRec={dupOld} 
        newItem={dupNew} 
        categories={categories} 
        subcategories={subcategories} 
        onClose={(choice: 'skip'|'overwrite') => {
          setDupModalOpen(false)
          const res = dupResolve
          setDupResolve(null)
          if (res) res(choice)
        }}
      />
      <h1 className="text-2xl font-bold">WIPO数据爬虫</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">技术ID（逗号/空格/换行分隔）</label>
          <textarea className="w-full h-24 border rounded p-2" value={idsInput} onChange={e => setIdsInput(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">上传CSV（第一列ID）</label>
          <input type="file" accept=".csv" onChange={e => e.target.files && handleCsv(e.target.files[0])} className="mb-2" />
          <label className="block text-sm font-medium mb-1">导入处理结果JSON</label>
          <input type="file" accept=".json" onChange={e => e.target.files && handleImportJSON(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">批量间隔(秒)</label>
          <input className="w-full border rounded p-2" type="number" value={intervalSec} onChange={e => setIntervalSec(parseInt(e.target.value||'0',10))} />
        </div>
        <div className="text-xs text-gray-500">
          已抓取: {items.length} 条<br/>
          已处理: {items.filter(item => item.description_en && item.description_zh).length} 条<br/>
          待导入: {items.filter(item => item.description_en && item.description_zh && !item.imported).length} 条<br/>
          已导入: {items.filter(item => item.imported).length} 条
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">技术类型（主分类）</label>
          <select className="w-full border rounded p-2" value={categoryId} onChange={e => { setCategoryId(e.target.value); loadSubcategories(e.target.value) }}>
            <option value="">请选择主分类</option>
            {categories.map((c: any) => (<option key={c.id} value={c.id}>{c.name_zh}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">技术类型（子分类）</label>
          <select className="w-full border rounded p-2" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} disabled={!categoryId}>
            <option value="">请选择子分类</option>
            {subcategories.map((s: any) => (<option key={s.id} value={s.id}>{s.name_zh}</option>))}
          </select>
        </div>
        <div className="text-xs text-gray-500">
          导入选项固定：技术来源=自主开发，技术获取方式=WIPO
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* 重复处理策略 */}
        <div className="text-sm text-gray-700 flex items-center gap-3 mr-4">
          <span className="text-gray-600">重复数据处理：</span>
          <label className="flex items-center gap-1">
            <input type="radio" name="dupPolicy" checked={onDuplicate==='prompt'} onChange={()=>setOnDuplicate('prompt')} /> 提示逐条确认
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="dupPolicy" checked={onDuplicate==='skip'} onChange={()=>setOnDuplicate('skip')} /> 发现重复跳过
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="dupPolicy" checked={onDuplicate==='overwrite'} onChange={()=>setOnDuplicate('overwrite')} /> 发现重复覆盖
          </label>
        </div>
        {/* 暂停/继续按钮（抓取与导入过程均适用） */}
        { (processing || batchImporting) && (
          <button onClick={() => setPaused(p => !p)} className={`px-3 py-2 rounded ${paused ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}>
            {paused ? '继续' : '暂停'}
          </button>
        )}
        <button disabled={processing || batchImporting} onClick={handleScrapeAndProcess} className="px-4 py-2 bg-purple-600 text-white rounded font-semibold">
          🚀 抓取+处理（需验证后导入）
        </button>
        <button disabled={processing || batchImporting} onClick={handleScrapeBatch} className="px-4 py-2 bg-green-600 text-white rounded">
          仅抓取数据
        </button>
        <button disabled={batchImporting || !items.filter(item => item.description_en && item.description_zh && !item.imported).length} onClick={handleBatchImport} className="px-4 py-2 bg-orange-600 text-white rounded">
          {batchImporting ? '批量导入中...' : `批量导入 (${items.filter(item => item.description_en && item.description_zh && !item.imported).length} 条)`}
        </button>
        {/* 导出失败ID CSV */}
        <button 
          onClick={() => {
            if (!failedIds.length) { alert('暂无抓取失败的ID'); return }
            const header = 'id\n'
            const body = failedIds.join('\n')
            const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `wipo-failed-ids-${Date.now()}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >导出失败ID CSV</button>
        <button onClick={handleExportJSON} className="px-4 py-2 bg-blue-600 text-white rounded">导出JSON</button>
        <button onClick={() => setItems([])} className="px-4 py-2 bg-gray-500 text-white rounded">清空列表</button>
        
        {/* 进度条 */}
        {(processing || batchImporting) && (
          <div className="flex-1 min-w-48">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-600 rounded transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            {batchImporting && <div className="text-xs text-gray-500 mt-1">批量导入进度</div>}
            {processing && <div className="text-xs text-gray-500 mt-1">抓取/处理进度</div>}
          </div>
        )}
      </div>
      {/* 日志区域 */}
      <div className="bg-gray-50 border rounded p-3 text-xs text-gray-700 whitespace-pre-wrap" style={{ maxHeight: 160, overflowY: 'auto' }}>
        {logs.length ? logs.join('\n') : '日志输出将在这里显示...'}
      </div>
      <div className="space-y-4">
        {items.map((it, idx) => (
          <div key={idx} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                ID: {it.id} — {it.technologyNameEN}
                {it.imported && <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">已导入</span>}
                {it.description_zh && !it.imported && <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">待导入</span>}
                {it.processed && !it.description_zh && <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">处理中</span>}
                {!it.description_zh && !it.processed && <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">未处理</span>}
              </div>
              <div className="space-x-2">
                <button onClick={() => compose(idx)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded" disabled={it.imported}>
                  {it.description_zh ? '重新处理' : '处理数据'}
                </button>
                <button onClick={() => handleImport(idx)} className="px-3 py-1 text-sm bg-green-600 text-white rounded" disabled={it.imported || !it.description_zh}>
                  {it.imported ? '已导入' : '确认导入'}
                </button>
                <button onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="px-3 py-1 text-sm bg-gray-200 rounded">删除</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="text-xs text-gray-500">企业名称</label>
                <input className="w-full border rounded p-2" value={it.companyName||''} onChange={e=>{const n=[...items]; n[idx].companyName=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">企业网站</label>
                <input className="w-full border rounded p-2" value={it.companyWebsiteUrl||''} onChange={e=>{const n=[...items]; n[idx].companyWebsiteUrl=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">图片URL</label>
                <input className="w-full border rounded p-2" value={it.technologyImageUrl||''} onChange={e=>{const n=[...items]; n[idx].technologyImageUrl=e.target.value; setItems(n)}} />
                {/* 预览缩略图 (URL+.jpg) */}
                {it.technologyImageUrl && (
                  <img
                    src={`${String(it.technologyImageUrl).replace(/\/$/,'')}.jpg`}
                    alt="thumbnail"
                    className="mt-2 w-32 h-32 object-contain border rounded bg-white"
                    onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Developed in（开发国家）</label>
                <input className="w-full border rounded p-2" value={it.developedInCountry||''} onChange={e=>{const n=[...items]; n[idx].developedInCountry=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">应用国家/地区（逗号分隔）</label>
                <input className="w-full border rounded p-2" value={Array.isArray(it.deployedInCountry)?it.deployedInCountry.join(', '):(it.deployedInCountry||'')} onChange={e=>{const n=[...items]; n[idx].deployedInCountry=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">自定义标签（|分隔）</label>
                <input className="w-full border rounded p-2" value={(it.customLabels||[]).join('|')} onChange={e=>{const n=[...items]; n[idx].customLabels=e.target.value.split('|').map((s:string)=>s.trim()).filter(Boolean); setItems(n)}} />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs text-gray-500">英文描述（预览）</label>
                <textarea className="w-full h-24 border rounded p-2" value={it.description_en||''} onChange={e=>{const n=[...items]; n[idx].description_en=e.target.value; setItems(n)}} />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs text-gray-500">中文描述（预览）</label>
                <textarea className="w-full h-24 border rounded p-2" value={it.description_zh||''} onChange={e=>{const n=[...items]; n[idx].description_zh=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">技术收益</label>
                <input className="w-full border rounded p-2" value={it.benefits||''} onChange={e=>{const n=[...items]; n[idx].benefits=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">技术收益描述</label>
                <textarea className="w-full border rounded p-2" value={it.benefitsDescription||''} onChange={e=>{const n=[...items]; n[idx].benefitsDescription=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">技术成熟度</label>
                <input className="w-full border rounded p-2" value={it.technologyReadinessLevel||''} onChange={e=>{const n=[...items]; n[idx].technologyReadinessLevel=e.target.value; setItems(n)}} />
              </div>
              <div>
                <label className="text-xs text-gray-500">知识产权（如有）</label>
                <input className="w-full border rounded p-2" value={it.intellectualProperty||''} onChange={e=>{const n=[...items]; n[idx].intellectualProperty=e.target.value; setItems(n)}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 内联对比弹窗组件（简化版）：展示老数据 vs 新数据
function FieldRow({ label, left, right }: { label: string, left: any, right: any }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1 text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="bg-gray-50 p-2 rounded min-h-[36px] break-words">{left || '-'}</div>
      <div className="bg-gray-50 p-2 rounded min-h-[36px] break-words">{right || '-'}</div>
    </div>
  )
}

function ImageRow({ label, left, right }: { label: string, left?: string | null, right?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1 text-sm items-start">
      <div className="text-gray-500 mt-1">{label}</div>
      <div className="bg-gray-50 p-2 rounded min-h-[36px]">
        {left ? <img src={left} className="w-full h-32 object-cover rounded" /> : <span className="text-gray-400">-</span>}
      </div>
      <div className="bg-gray-50 p-2 rounded min-h-[36px]">
        {right ? <img src={right} className="w-full h-32 object-cover rounded" /> : <span className="text-gray-400">-</span>}
      </div>
    </div>
  )
}

function DuplicateCompareModal({ open, oldRec, newItem, categories, subcategories, onClose }: any) {
  if (!open) return null
  // 映射新数据的类别名称（从页面已有的列表取）
  const newCatName = categories.find((c: any) => c.id === newItem?.category_id)?.name_zh || ''
  const newSubName = subcategories.find((s: any) => s.id === newItem?.subcategory_id)?.name_zh || ''
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">发现重复数据（ID: {newItem?.id}）</h3>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 mb-2">
            <div></div>
            <div className="text-center font-medium">老数据</div>
            <div className="text-center font-medium">新数据</div>
          </div>
          <FieldRow label="技术名称（中文）" left={oldRec?.name_zh} right={newItem?.technologyNameCN || newItem?.technologyNameEN} />
          <FieldRow label="技术名称（英文）" left={oldRec?.name_en} right={newItem?.technologyNameEN} />
          <FieldRow label="技术网址" left={oldRec?.website_url} right={newItem?.companyWebsiteUrl} />
          <FieldRow label="技术分类/子分类" left={[oldRec?.category_name_zh, oldRec?.subcategory_name_zh].filter(Boolean).join(' / ')} right={[newCatName, newSubName].filter(Boolean).join(' / ')} />
          <ImageRow label="技术图片" left={oldRec?.image_url} right={newItem?.technologyImageUrl} />
          <FieldRow label="企业名称（中/英）" left={[oldRec?.company_name_zh, oldRec?.company_name_en].filter(Boolean).join(' / ')} right={[newItem?.companyName, newItem?.companyName].filter(Boolean).join(' / ')} />
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="text-gray-500 mt-1">中文描述</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-line text-sm">{oldRec?.description_zh || '-'}</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-line text-sm">{newItem?.description_zh || '-'}</div>
          </div>
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="text-gray-500 mt-1">英文描述</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-line text-sm">{oldRec?.description_en || '-'}</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-line text-sm">{newItem?.description_en || '-'}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={() => onClose('skip')} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-100">跳过该条</button>
          <button onClick={() => onClose('overwrite')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">用新数据覆盖</button>
        </div>
      </div>
    </div>
  )
}
