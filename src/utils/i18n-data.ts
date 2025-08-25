// 多语言数据处理工具函数

/**
 * 根据当前语言获取正确的文本内容
 * @param zhText 中文文本
 * @param enText 英文文本  
 * @param locale 当前语言代码
 * @returns 对应语言的文本
 */
export function getLocalizedText(zhText: string, enText: string, locale: string): string {
  return locale === 'en' ? (enText || zhText) : zhText;
}

/**
 * 根据当前语言获取分类名称
 */
export function getCategoryName(category: { name: string; nameEn: string }, locale: string): string {
  return getLocalizedText(category.name, category.nameEn, locale);
}

/**
 * 根据当前语言获取公司名称
 */
export function getCompanyName(company: { companyName: string; companyNameEn: string }, locale: string): string {
  return getLocalizedText(company.companyName, company.companyNameEn, locale);
}

/**
 * 格式化日期显示
 */
export function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return locale === 'en' 
    ? date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
}

/**
 * 获取本地化的标签文本
 */
export function getLocalizedLabels(locale: string) {
  return {
    category: locale === 'en' ? 'Category' : '分类',
    company: locale === 'en' ? 'Company' : '公司',
    location: locale === 'en' ? 'Location' : '地区',
    updateTime: locale === 'en' ? 'Updated' : '更新时间',
    viewDetails: locale === 'en' ? 'View Details' : '查看详情',
    loadMore: locale === 'en' ? 'Load More' : '加载更多',
    noResults: locale === 'en' ? 'No results found' : '暂无相关结果'
  };
}