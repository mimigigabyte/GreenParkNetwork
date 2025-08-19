const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 检查数据库表...')
  
  const tables = [
    'admin_categories',
    'admin_subcategories', 
    'admin_countries',
    'admin_provinces',
    'admin_development_zones',
    'admin_carousel_images',
    'admin_companies',
    'admin_technologies'
  ]
  
  for (const table of tables) {
    try {
      console.log(`\n📋 检查表: ${table}`)
      
      // 尝试查询表结构
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ 表 ${table} 不存在或无法访问:`, error.message)
      } else {
        console.log(`✅ 表 ${table} 存在`)
        
        // 获取表结构信息
        try {
          const { data: columns, error: columnError } = await supabase
            .rpc('get_table_columns', { table_name: table })
          
          if (columnError) {
            console.log(`   📝 无法获取列信息: ${columnError}`)
          } else if (columns) {
            console.log(`   📝 列信息:`, columns)
          }
        } catch (rpcError) {
          console.log(`   📝 无法获取列信息: ${rpcError.message}`)
        }
      }
    } catch (err) {
      console.log(`❌ 检查表 ${table} 时出错:`, err.message)
    }
  }
  
  console.log('\n🎯 检查完成!')
}

checkTables().catch(console.error)
