import Link from 'next/link'
import { getCategoryName, getCompanyName, formatDate, getLocalizedLabels } from '@/utils/i18n-data'

interface PageProps {
  params: { locale: string }
}

// 模拟产品分类数据（实际应从API获取）
const mockCategories = [
  {
    id: 'energy-saving',
    name: '节能环保技术',
    nameEn: 'ENERGY SAVING',
    icon: '🌱',
    count: 15,
    color: '#27ae60'
  },
  {
    id: 'clean-energy',
    name: '清洁能源技术', 
    nameEn: 'CLEAN ENERGY',
    icon: '⚡',
    count: 12,
    color: '#3498db'
  },
  {
    id: 'clean-production',
    name: '清洁生产技术',
    nameEn: 'CLEAN PRODUCTION', 
    icon: '🏭',
    count: 8,
    color: '#9b59b6'
  }
];

// 模拟技术产品数据（实际应从API获取）
const mockProducts = [
  {
    id: '1',
    companyName: '绿能科技有限公司',
    companyNameEn: 'Green Energy Tech Ltd.',
    solutionTitle: '太阳能发电解决方案',
    solutionDescription: '高效太阳能发电系统，为企业提供清洁能源',
    category: 'clean-energy',
    updateTime: '2024-01-15T10:30:00Z'
  },
  {
    id: '2', 
    companyName: '环保科技集团',
    companyNameEn: 'Environmental Technology Group',
    solutionTitle: '废水处理技术',
    solutionDescription: '先进的工业废水处理和回收技术',
    category: 'energy-saving',
    updateTime: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    companyName: '智能制造有限公司', 
    companyNameEn: 'Smart Manufacturing Co.',
    solutionTitle: '智能生产监控系统',
    solutionDescription: '基于IoT的智能生产线监控和优化系统',
    category: 'clean-production',
    updateTime: '2024-01-08T09:15:00Z'
  }
];

export default function DemoPage({ params }: PageProps) {
  const labels = getLocalizedLabels(params.locale);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* 导航 */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          href={`/${params.locale}`}
          style={{ 
            color: '#007acc', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          ← {params.locale === 'zh' ? '返回首页' : 'Back to Home'}
        </Link>
      </div>

      {/* 语言切换器 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <Link 
          href="/zh/demo" 
          style={{ 
            padding: '6px 12px', 
            backgroundColor: params.locale === 'zh' ? '#007acc' : '#e0e0e0',
            color: params.locale === 'zh' ? 'white' : 'black',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          🇨🇳 中文
        </Link>
        <Link 
          href="/en/demo" 
          style={{ 
            padding: '6px 12px', 
            backgroundColor: params.locale === 'en' ? '#007acc' : '#e0e0e0',
            color: params.locale === 'en' ? 'white' : 'black',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          🇬🇧 English
        </Link>
      </div>

      {/* 页面标题 */}
      <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
        {params.locale === 'zh' ? '🔧 动态数据多语言演示' : '🔧 Dynamic Data Multilingual Demo'}
      </h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        {params.locale === 'zh' 
          ? '展示如何根据当前语言显示数据库中的动态内容'
          : 'Demonstrates how to display dynamic content from database based on current language'
        }
      </p>

      {/* 产品分类展示 */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#34495e', marginBottom: '20px' }}>
          📊 {params.locale === 'zh' ? '产品分类' : 'Product Categories'}
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px' 
        }}>
          {mockCategories.map((category) => (
            <div 
              key={category.id}
              style={{
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: `2px solid ${category.color}20`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{category.icon}</span>
                <div>
                  <h3 style={{ 
                    margin: '0 0 5px 0', 
                    color: category.color,
                    fontSize: '16px'
                  }}>
                    {getCategoryName(category, params.locale)}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#7f8c8d', 
                    fontSize: '14px' 
                  }}>
                    {category.count} {params.locale === 'zh' ? '项技术' : 'technologies'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 技术产品展示 */}
      <div>
        <h2 style={{ color: '#34495e', marginBottom: '20px' }}>
          🏢 {params.locale === 'zh' ? '技术产品展示' : 'Technology Products'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {mockProducts.map((product) => {
            const category = mockCategories.find(cat => cat.id === product.category);
            return (
              <div 
                key={product.id}
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e8ed'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#2c3e50',
                      fontSize: '18px'
                    }}>
                      {product.solutionTitle}
                    </h3>
                    
                    <p style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555',
                      lineHeight: '1.5'
                    }}>
                      {product.solutionDescription}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px' }}>
                      <div>
                        <strong>{labels.company}:</strong>{' '}
                        <span style={{ color: '#007acc' }}>
                          {getCompanyName(product, params.locale)}
                        </span>
                      </div>
                      
                      {category && (
                        <div>
                          <strong>{labels.category}:</strong>{' '}
                          <span 
                            style={{ 
                              color: category.color,
                              backgroundColor: `${category.color}20`,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {getCategoryName(category, params.locale)}
                          </span>
                        </div>
                      )}

                      <div>
                        <strong>{labels.updateTime}:</strong>{' '}
                        <span style={{ color: '#7f8c8d' }}>
                          {formatDate(product.updateTime, params.locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 说明文本 */}
      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        borderLeft: '4px solid #007acc'
      }}>
        <h4 style={{ color: '#007acc', margin: '0 0 10px 0' }}>
          {params.locale === 'zh' ? '💡 技术说明' : '💡 Technical Notes'}
        </h4>
        <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>
          {params.locale === 'zh' 
            ? '此页面演示了如何根据当前语言(zh/en)显示数据库中的动态内容。产品分类使用 nameEn 字段，公司名称使用 companyNameEn 字段，日期格式也会根据语言进行本地化处理。'
            : 'This page demonstrates how to display dynamic content from database based on current language (zh/en). Product categories use the nameEn field, company names use the companyNameEn field, and date formats are also localized according to the language.'
          }
        </p>
      </div>
    </div>
  )
}