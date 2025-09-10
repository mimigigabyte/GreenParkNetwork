#!/usr/bin/env node
/**
 * Merge a list of admin_countries by code into the canonical 'korea' country.
 * - Reassigns admin_technologies.company_country_id from each source country to target country
 * - Attempts to delete the source countries; if FK prevents deletion, sets is_active=false instead
 *
 * Usage:
 *   node scripts/merge-countries-to-korea.js \
 *     --codes xx37,xx38,xx39,xx40,xx42,xx45,xx50 \
 *     --target korea
 */

const { createClient } = require('@supabase/supabase-js')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { codes: [], target: 'korea', alsoCompanies: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--codes' && args[i+1]) { out.codes = args[i+1].split(',').map(s => s.trim()).filter(Boolean); i++ }
    else if (a === '--target' && args[i+1]) { out.target = args[i+1].trim(); i++ }
    else if (a === '--also-companies') { out.alsoCompanies = true }
  }
  if (!out.codes.length) {
    console.error('Missing --codes. Example: --codes xx37,xx38,xx39')
    process.exit(2)
  }
  return out
}

async function main() {
  const { codes, target, alsoCompanies } = parseArgs()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(2)
  }
  const supabase = createClient(url, key)

  // Resolve target country id
  let targetId = null
  {
    // Try code match first
    const { data: targetByCode, error: tErr1 } = await supabase
      .from('admin_countries').select('id, code, name_zh, name_en').eq('code', target).limit(1)
    if (tErr1) throw tErr1
    if (targetByCode && targetByCode.length) {
      targetId = targetByCode[0].id
      console.log('Target country (by code):', targetByCode[0])
    } else {
      // Fallbacks for Korea
      const { data: alt, error: tErr2 } = await supabase
        .from('admin_countries')
        .select('id, code, name_zh, name_en')
        .or('name_en.ilike.Korea,name_zh.ilike.韩国,code.eq.kr')
        .limit(1)
      if (tErr2) throw tErr2
      if (!alt || !alt.length) {
        throw new Error(`Cannot find target country '${target}'. Please ensure it exists (code='${target}' or name includes '韩国'/'Korea').`)
      }
      targetId = alt[0].id
      console.log('Target country (fallback):', alt[0])
    }
  }

  const summary = { reassigned: 0, deleted: 0, deactivated: 0, sources: {} }

  for (const code of codes) {
    summary.sources[code] = { techUpdated: 0, deleted: false, deactivated: false }
    // Find source country by code
    const { data: srcList, error: sErr } = await supabase
      .from('admin_countries').select('id, code, name_zh, name_en, is_active').eq('code', code)
    if (sErr) throw sErr
    if (!srcList || !srcList.length) {
      console.warn(`Code '${code}': not found. Skipping.`)
      continue
    }
    for (const src of srcList) {
      if (src.id === targetId) {
        console.log(`Code '${code}': already target. Skipping.`)
        continue
      }
      // Reassign technologies
      const { error: upTechErr, count } = await supabase
        .from('admin_technologies')
        .update({ company_country_id: targetId })
        .eq('company_country_id', src.id)
        .select('*', { count: 'exact', head: true })
      if (upTechErr) {
        console.error(`Failed to update technologies for code '${code}':`, upTechErr.message)
      } else {
        const updated = typeof count === 'number' ? count : 0
        summary.reassigned += updated
        summary.sources[code].techUpdated += updated
        console.log(`Code '${code}': reassigned ${updated} technologies -> target`)
      }

      if (alsoCompanies) {
        const { error: upCompErr, count: compCount } = await supabase
          .from('admin_companies')
          .update({ country_id: targetId })
          .eq('country_id', src.id)
          .select('*', { count: 'exact', head: true })
        if (upCompErr) {
          console.warn(`Code '${code}': failed to update companies:`, upCompErr.message)
        } else {
          console.log(`Code '${code}': reassigned ${compCount || 0} companies -> target`)
        }
      }

      // Try delete source country
      const { error: delErr } = await supabase
        .from('admin_countries')
        .delete()
        .eq('id', src.id)
      if (delErr) {
        console.warn(`Code '${code}': delete failed (${delErr.message}). Will set is_active=false.`)
        const { error: deactErr } = await supabase
          .from('admin_countries')
          .update({ is_active: false })
          .eq('id', src.id)
        if (deactErr) {
          console.error(`Code '${code}': failed to deactivate country:`, deactErr.message)
        } else {
          summary.deactivated += 1
          summary.sources[code].deactivated = true
        }
      } else {
        summary.deleted += 1
        summary.sources[code].deleted = true
      }
    }
  }

  console.log('Merge summary:', JSON.stringify(summary, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })

