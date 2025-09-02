'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { I18nCompactImageUpload } from '@/components/ui/i18n-compact-image-upload';
import { useAuthContext } from '@/components/auth/auth-provider';
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data';
import { COMPANY_TYPE_OPTIONS } from '@/lib/types/admin';
import { isValidEmail, isValidPhone, emailError, phoneError } from '@/lib/validators';

// 企业信息数据类型
interface CompanyInfo {
  companyName: string;
  logoUrl?: string; // Logo的URL
  country: string;
  province: string;
  economicZone: string;
  companyType: string;
  address: string;
  industryCode: string;
  annualOutput: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

interface PageProps {
  params: { locale: string };
}

export default function UserCompaniesPage({ params }: PageProps) {
  const { user } = useAuthContext();
  const t = useTranslations('userCompanies');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    logoUrl: '',
    country: '',
    province: '',
    economicZone: '',
    companyType: '',
    address: '',
    industryCode: '',
    annualOutput: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  const { 
    data: filterData, 
    isLoading: isLoadingFilter, 
    loadProvinces, 
    loadDevelopmentZones 
  } = useFilterData();

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user?.email || user?.phone || user?.name || 'User';
  };

  // 加载企业信息
  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      
      // 导入API函数
      const { getUserCompanyInfo } = await import('@/api/company');
      const response = await getUserCompanyInfo();
      
      if (response.success && response.data) {
        // 将数据库数据转换为表单格式
        const companyData = response.data;
        console.log('从数据库加载的企业数据:', companyData);
        console.log('企业logo URL:', companyData.logo_url);
        setCompanyInfo({
          companyName: companyData.name_zh || '',
          logoUrl: companyData.logo_url || '',
          country: companyData.country?.code || '',
          province: companyData.province?.code || '',
          economicZone: companyData.development_zone?.code || '',
          companyType: companyData.company_type || '',
          address: companyData.address || '',
          industryCode: companyData.industry_code || '',
          annualOutput: companyData.annual_output_value?.toString() || '',
          contactPerson: companyData.contact_person || '',
          // 始终以账号信息为准进行展示，确保与管理端修改保持同步；保存时会写回后端
          contactPhone: (user?.phone || companyData.contact_phone || ''),
          contactEmail: (user?.email || companyData.contact_email || '')
        });

        // 如果有省份信息，加载省份列表
        if (companyData.country?.code === 'china' && companyData.country?.id) {
          loadProvinces(companyData.country.id);
        }

        // 如果有开发区信息，加载开发区列表
        if (companyData.province?.id) {
          loadDevelopmentZones(companyData.province.id);
        }
      } else {
        // 如果没有企业信息，设置默认空值
        setCompanyInfo({
          companyName: '',
          logoUrl: '',
          country: '',
          province: '',
          economicZone: '',
          companyType: '',
          address: '',
          industryCode: '',
          annualOutput: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: ''
        });
      }
    } catch (error) {
      console.error('加载企业信息失败:', error);
      // 设置默认空值
      setCompanyInfo({
        companyName: '',
        logoUrl: '',
        country: '',
        province: '',
        economicZone: '',
        companyType: '',
        address: '',
        industryCode: '',
        annualOutput: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: ''
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  if (loading || isLoadingFilter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  const {
    countries,
    provinces,
    developmentZones
  } = transformFilterDataForComponents(filterData, params.locale === 'en' ? 'en' : 'zh');

  const handleInputChange = (field: string, value: string | File | null) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'country' && value !== 'china' ? { province: '', economicZone: '' } : {}),
      ...(field === 'province' ? { economicZone: '' } : {})
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'country') {
      const selectedCountry = countries.find(c => c.value === value);
      if (selectedCountry && selectedCountry.value === 'china') {
        const chinaCountry = filterData.countries.find(c => c.code === 'china');
        if (chinaCountry) {
          loadProvinces(chinaCountry.id);
        }
      } else {
        setCompanyInfo(prev => ({ ...prev, province: '', economicZone: '' }));
      }
    }

    if (field === 'province') {
      const selectedProvince = filterData.provinces.find(p => p.code === value);
      if (selectedProvince) {
        loadDevelopmentZones(selectedProvince.id);
      } else {
        setCompanyInfo(prev => ({ ...prev, economicZone: '' }));
      }
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const localeTag = (params.locale === 'en' ? 'en' : 'zh') as 'en' | 'zh'
    
    if (!companyInfo.companyName) newErrors.companyName = t('validation.companyNameRequired');
    if (!companyInfo.country) newErrors.country = t('validation.countryRequired');
    if (companyInfo.country === 'china' && !companyInfo.province) {
      newErrors.province = t('validation.provinceRequired');
    }
    if (!companyInfo.companyType) newErrors.companyType = t('validation.companyTypeRequired');
    if (!companyInfo.contactPerson) newErrors.contactPerson = t('validation.contactPersonRequired');
    if (!companyInfo.contactPhone) {
      newErrors.contactPhone = t('validation.contactPhoneRequired');
    } else if (!isValidPhone(companyInfo.contactPhone, '+86')) {
      newErrors.contactPhone = phoneError(localeTag);
    }
    if (!companyInfo.contactEmail) {
      newErrors.contactEmail = t('validation.contactEmailRequired');
    } else if (!isValidEmail(companyInfo.contactEmail)) {
      newErrors.contactEmail = emailError(localeTag);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // 导入API函数
      const { submitCompanyProfile } = await import('@/api/company');
      
      // 构建提交数据
      const submitData = {
        companyName: companyInfo.companyName,
        logoUrl: companyInfo.logoUrl,
        country: companyInfo.country,
        province: companyInfo.province,
        economicZone: companyInfo.economicZone,
        companyType: companyInfo.companyType,
        address: companyInfo.address,
        industryCode: companyInfo.industryCode,
        annualOutput: companyInfo.annualOutput,
        contactPerson: companyInfo.contactPerson,
        contactPhone: companyInfo.contactPhone,
        contactEmail: companyInfo.contactEmail
      } as any;

      const response = await submitCompanyProfile(submitData);
      
      if (response.success) {
        alert(t('saveSuccess'));
        // 重新加载数据以显示最新信息
        await loadCompanyInfo();
      } else {
        throw new Error(response.error || t('saveFailed'));
      }
    } catch (error) {
      console.error('保存企业信息失败:', error);
      alert(t('saveFailed') + ': ' + (error instanceof Error ? error.message : t('pleaseRetry')));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 重新加载企业信息，恢复到保存前的状态
    loadCompanyInfo();
  };

  const renderError = (field: string) => {
    return errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;
  };

  return (
    <div className="space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-3 py-1.5 text-sm rounded transition-colors ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* 基本信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">{t('basicInfo.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('basicInfo.companyName')}</label>
                <input 
                  type="text" 
                  value={companyInfo.companyName} 
                  onChange={(e) => handleInputChange('companyName', e.target.value)} 
                  placeholder={t('basicInfo.companyNamePlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('companyName')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('basicInfo.logo')} <span className="text-gray-400">({t('optional')})</span></label>
                <I18nCompactImageUpload
                  value={companyInfo.logoUrl}
                  onChange={(url) => handleInputChange('logoUrl', url)}
                  bucket="images"
                  folder="company-logos"
                  placeholder={t('basicInfo.selectFile')}
                  maxSize={5}
                  locale={params.locale}
                />
              </div>
            </div>
          </div>

          {/* 地址信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">{t('addressInfo.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('addressInfo.country')}</label>
                <div className="relative">
                  <select 
                    value={companyInfo.country} 
                    onChange={(e) => handleInputChange('country', e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="">{t('addressInfo.selectCountry')}</option>
                    {countries.map((country) => (
                      <option key={country.value} value={country.value}>{country.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('country')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('addressInfo.province')}</label>
                <div className="relative">
                  <select 
                    value={companyInfo.province} 
                    onChange={(e) => handleInputChange('province', e.target.value)} 
                    disabled={companyInfo.country !== 'china'} 
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none ${
                      companyInfo.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="">{t('addressInfo.selectProvince')}</option>
                    {provinces.map((province) => (
                      <option key={province.value} value={province.value}>{province.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('province')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('addressInfo.economicZone')} <span className="text-gray-400">({t('optional')})</span></label>
                <div className="relative">
                  <select 
                    value={companyInfo.economicZone} 
                    onChange={(e) => handleInputChange('economicZone', e.target.value)} 
                    disabled={!companyInfo.province || companyInfo.country !== 'china'} 
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none ${
                      !companyInfo.province || companyInfo.country !== 'china' 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white'
                    }`}
                  >
                    <option value="">{t('addressInfo.selectZone')}</option>
                    <option value="none">{t('addressInfo.notInZone')}</option>
                    {developmentZones.map((zone) => (
                      <option key={zone.value} value={zone.value}>{zone.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('addressInfo.detailAddress')} <span className="text-gray-400">({t('optional')})</span></label>
                <input 
                  type="text" 
                  value={companyInfo.address} 
                  onChange={(e) => handleInputChange('address', e.target.value)} 
                  placeholder={t('addressInfo.addressPlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
            </div>
          </div>

          {/* 企业详情 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">{t('companyDetails.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('companyDetails.companyType')}</label>
                <div className="relative">
                  <select 
                    value={companyInfo.companyType} 
                    onChange={(e) => handleInputChange('companyType', e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="">{t('companyDetails.selectCompanyType')}</option>
                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {params.locale === 'en' ? opt.label_en : opt.label_zh}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('companyType')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('companyDetails.industryCode')} <span className="text-gray-400">({t('optional')})</span></label>
                <input 
                  type="text" 
                  value={companyInfo.industryCode} 
                  onChange={(e) => handleInputChange('industryCode', e.target.value)} 
                  placeholder={t('companyDetails.industryCodePlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('companyDetails.annualOutput')} <span className="text-gray-400">({t('optional')})</span></label>
                <input 
                  type="number" 
                  value={companyInfo.annualOutput} 
                  onChange={(e) => handleInputChange('annualOutput', e.target.value)} 
                  placeholder={t('companyDetails.outputPlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">{t('contactInfo.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('contactInfo.contactPerson')}</label>
                <input 
                  type="text" 
                  value={companyInfo.contactPerson} 
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)} 
                  placeholder={t('contactInfo.contactPersonPlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('contactPerson')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('contactInfo.contactPhone')}</label>
                <input 
                  type="tel" 
                  value={companyInfo.contactPhone} 
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)} 
                  placeholder={t('contactInfo.contactPhonePlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('contactPhone')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">{t('contactInfo.contactEmail')}</label>
                <input 
                  type="email" 
                  value={companyInfo.contactEmail} 
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)} 
                  placeholder={t('contactInfo.contactEmailPlaceholder')} 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('contactEmail')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
