const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCategoriesData() {
  console.log('🔍 检查分类数据...')
  
  try {
    // 检查主分类
    console.log('\n📋 检查主分类数据:')
    const { data: categories, error: categoriesError } = await supabase
      .from('admin_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (categoriesError) {
      console.log('❌ 获取主分类失败:', categoriesError.message)
    } else {
      console.log(`✅ 找到 ${categories.length} 个主分类:`)
      categories.forEach(cat => {
        console.log(`   - ${cat.name_zh} (${cat.name_en}) - ID: ${cat.id}`)
      })
    }

    // 检查子分类
    console.log('\n📋 检查子分类数据:')
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('admin_subcategories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (subcategoriesError) {
      console.log('❌ 获取子分类失败:', subcategoriesError.message)
    } else {
      console.log(`✅ 找到 ${subcategories.length} 个子分类:`)
      subcategories.forEach(sub => {
        console.log(`   - ${sub.name_zh} (${sub.name_en}) - 分类ID: ${sub.category_id}`)
      })
    }

    // 如果没有数据，提供插入示例数据的选项
    if ((!categories || categories.length === 0) && (!subcategories || subcategories.length === 0)) {
      console.log('\n⚠️  没有找到分类数据，是否需要插入示例数据？')
      console.log('运行以下命令插入示例数据:')
      console.log('node scripts/insert-sample-categories.js')
    }

  } catch (error) {
    console.error('❌ 检查分类数据时出错:', error.message)
  }
  
  console.log('\n🎯 检查完成!')
}

checkCategoriesData().catch(console.error)
