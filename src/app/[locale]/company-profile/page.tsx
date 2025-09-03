'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Upload, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { submitCompanyProfile, CompanyProfileData } from '@/api/company';
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data';
import { COMPANY_TYPE_OPTIONS } from '@/lib/types/admin';
import { generateCompanyLogo } from '@/lib/logoGenerator';
import { useAuthContext } from '@/components/auth/auth-provider';
import { CompanySearch, CompanySearchResult } from '@/components/company/company-search';
import { supabase } from '@/lib/supabase';

interface PageProps {
  params: { locale: string };
}

export default function CompanyProfilePage({ params }: PageProps) {
  const router = useRouter();
  const { user, loading, checkUser } = useAuthContext();
  const t = useTranslations('companyProfile');
  const tCommon = useTranslations('common');
  
  // 页面初始化时检查认证状态
  useEffect(() => {
    (async () => {
      const customTokenExists = !!localStorage.getItem('custom_auth_token');
      const legacyTokenExists = !!localStorage.getItem('access_token');
      const { data: { session } } = await supabase.auth.getSession();

      console.log('🔍 页面初始化 - 认证状态快照:', {
        customToken: customTokenExists ? '存在' : '不存在',
        legacyToken: legacyTokenExists ? '存在' : '不存在',
        supabaseSession: session?.access_token ? '存在' : '不存在',
        supabaseUserId: session?.user?.id || '无',
        userLoading: loading,
        userExists: !!user
      });

      // 如果任一token/session存在，但上下文用户为空且不在加载，主动触发一次校验以消除竞态
      if ((customTokenExists || legacyTokenExists || session?.access_token) && !user && !loading) {
        console.log('🔄 发现凭证但用户为空，触发一次认证校验');
        try {
          await checkUser();
        } catch (e) {
          console.warn('认证校验触发失败:', e);
        }
      }
    })();
  }, []);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    requirement: '',
    companyName: '',
    logoFile: null as File | null,
    country: '',
    province: '',
    economicZone: '',
    // Step 2
    companyType: '',
    address: '',
    industryCode: '',
    annualOutput: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    // 企查查相关字段
    creditCode: ''
  });

  // 自动填充用户注册信息
  useEffect(() => {
    console.log('🔍 用户状态变化:', { user, loading });
    if (user) {
      console.log('✅ 用户信息详情:', {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        authType: user.authType
      });
      setFormData(prev => ({
        ...prev,
        contactPhone: user.phone || '',
        contactEmail: user.email || ''
      }));
    } else if (!loading) {
      console.log('❌ 用户未登录且不在加载中');
    }
  }, [user, loading]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const requirements = [
    t('requirements.publishTech'),
    t('requirements.findTech'),
    t('requirements.industryInsights')
  ];

  const { 
    data: filterData, 
    isLoading: isLoadingFilter, 
    loadProvinces, 
    loadDevelopmentZones 
  } = useFilterData();

  // 如果正在加载认证状态或过滤数据，显示加载状态
  if (loading || isLoadingFilter) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600">
          {loading ? '检查登录状态中...' : tCommon('loading')}
        </div>
      </div>
    );
  }
  
  // 如果认证检查完成但用户未登录，且localStorage中确实没有token，才显示需要登录
  if (!loading && !user) {
    const hasToken = localStorage.getItem('custom_auth_token') || localStorage.getItem('access_token');
    
    if (!hasToken) {
      // 确实没有token，需要登录
      return (
        <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">需要登录</h2>
            <p className="text-gray-600 mb-6">请先登录后再完善企业信息</p>
            <button 
              onClick={() => router.push(`/${params.locale}`)}
              className="w-full py-3 px-6 rounded-lg font-medium text-lg transition-colors bg-[#00b899] hover:bg-[#009a7a] text-white"
            >
              返回首页登录
            </button>
          </div>
        </div>
      );
    } else {
      // 有token但用户状态未加载，显示等待状态
      return (
        <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
          <div className="text-lg font-medium text-gray-600">
            正在验证登录状态...
          </div>
        </div>
      );
    }
  }

  const { 
    countries, 
    provinces, 
    developmentZones 
  } = transformFilterDataForComponents(filterData || {
    categories: [],
    countries: [],
    provinces: [],
    developmentZones: []
  }, params.locale);

  // 处理企业选择的回调
  const handleCompanySelect = (company: CompanySearchResult) => {
    setFormData(prev => ({
      ...prev,
      companyName: company.name,
      contactPerson: company.legalRepresentative || prev.contactPerson,
      address: company.address || prev.address,
      creditCode: company.creditCode,
    }));

    // 清除相关错误信息
    setErrors(prev => ({
      ...prev,
      companyName: '',
      contactPerson: company.legalRepresentative ? '' : prev.contactPerson,
      address: company.address ? '' : prev.address,
    }));

    // 生成logo预览
    if (!formData.logoFile && company.name) {
      generateLogoPreview(company.name);
    }
  };

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'country' && value !== 'china' ? { province: '', economicZone: '' } : {}),
      ...(field === 'province' ? { economicZone: '' } : {})
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // 当企业名称改变且没有上传logo时，生成预览logo
    if (field === 'companyName' && value && typeof value === 'string' && !formData.logoFile) {
      generateLogoPreview(value);
    }

    if (field === 'country') {
      const selectedCountry = (countries || []).find(c => c.value === value);
      if (selectedCountry && selectedCountry.value === 'china') {
        const chinaCountry = (filterData?.countries || []).find(c => c.code === 'china');
        if (chinaCountry) {
          loadProvinces(chinaCountry.id);
        }
      } else {
        // 如果选择的不是中国，清空省份和经开区
        setFormData(prev => ({ ...prev, province: '', economicZone: '' }));
      }
    }

    if (field === 'province') {
      const selectedProvince = (filterData?.provinces || []).find(p => p.code === value);
      if (selectedProvince) {
        loadDevelopmentZones(selectedProvince.id);
      } else {
        // 如果省份被清空，也清空经开区
        setFormData(prev => ({ ...prev, economicZone: '' }));
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('logoFile', file);
      // 当用户上传了logo，清除预览
      setLogoPreview(null);
    }
  };

  const generateLogoPreview = async (companyName: string) => {
    if (companyName.length < 2) {
      setLogoPreview(null);
      return;
    }
    
    try {
      const logoDataUrl = await generateCompanyLogo({
        companyName,
        size: 128, // 预览时使用较小尺寸
      });
      setLogoPreview(logoDataUrl);
    } catch (error) {
      console.error('生成logo预览失败:', error);
      setLogoPreview(null);
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.requirement) newErrors.requirement = t('validation.requirementRequired');
      if (!formData.companyName) newErrors.companyName = t('validation.companyNameRequired');
      if (!formData.country) newErrors.country = t('validation.countryRequired');
      if (formData.country === 'china' && !formData.province) {
        newErrors.province = t('validation.provinceRequired');
      }
    } else if (currentStep === 2) {
      if (!formData.companyType) newErrors.companyType = t('validation.companyTypeRequired');
      if (!formData.contactPerson) newErrors.contactPerson = t('validation.contactPersonRequired');
      if (!formData.contactPhone) newErrors.contactPhone = t('validation.contactPhoneRequired');
      if (!formData.contactEmail) newErrors.contactEmail = t('validation.contactEmailRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(1)) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    // 调试：检查用户登录状态和token
    console.log('🔍 提交前用户状态检查:', {
      userExists: !!user,
      userId: user?.id,
      authType: user?.authType,
      customToken: localStorage.getItem('custom_auth_token') ? 'exists' : 'missing',
      legacyToken: localStorage.getItem('access_token') ? 'exists' : 'missing'
    });
    
    // 如果用户信息不存在，显示友好提示
    if (!user) {
      alert('请先登录后再提交企业信息');
      return;
    }
    
    setSubmitLoading(true);
    try {
      let logoUrl = '';
      
      // 如果用户没有上传logo，自动生成一个
      if (!formData.logoFile && formData.companyName) {
        try {
          const logoResponse = await fetch('/api/generate-logo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyName: formData.companyName,
              size: 256
            }),
          });
          
          if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            if (logoData.success && logoData.logoUrl) {
              logoUrl = logoData.logoUrl;
              console.log('自动生成logo成功:', logoUrl);
            } else {
              console.error('logo生成API返回失败:', logoData);
            }
          } else {
            const errorData = await logoResponse.json().catch(() => ({}));
            console.error('logo生成API请求失败:', logoResponse.status, errorData);
          }
        } catch (logoError) {
          console.error('生成logo失败:', logoError);
          // 如果生成logo失败，继续提交其他信息
        }
      }

      const submitData: CompanyProfileData = {
        ...formData,
        province: formData.province || undefined,
        economicZone: formData.economicZone || undefined,
        logoFile: formData.logoFile || undefined,
        logoUrl: logoUrl || undefined, // 添加生成的logo URL
      };
      
      const response = await submitCompanyProfile(submitData);
      if (response.success) {
        localStorage.setItem('company_name', formData.companyName);
        alert(t('submitSuccess'));
        setTimeout(() => router.push(`/${params.locale}`), 1000);
      }
    } catch (error) {
      console.error('提交失败:', error);
      
      // 根据错误类型提供友好的提示
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('用户未登录') || errorMessage.includes('401')) {
        alert('登录已过期，请重新登录后再试');
        // 可以考虑重定向到登录页面
        // router.push(`/${params.locale}/auth/login`);
      } else if (errorMessage.includes('请填写必填字段')) {
        alert('请检查并填写所有必填字段');
      } else {
        alert(`提交失败：${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderError = (field: string) => {
    return errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle', { step, totalSteps: 2 })}</p>
          
          {/* 调试：显示用户登录状态 */}
          {loading ? (
            <div className="mt-2 text-sm text-yellow-600">
              🔄 正在检查登录状态...
            </div>
          ) : user ? (
            <div className="mt-2 text-sm text-green-600">
              ✅ 已登录: {user.name} ({user.authType})
            </div>
          ) : (
            <div className="mt-2 text-sm text-red-600">
              ❌ 未登录 - 请先<button onClick={() => router.push(`/${params.locale}`)} className="underline text-blue-600 hover:text-blue-800">返回首页登录</button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('step1.requirement')}<span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={formData.requirement} onChange={(e) => handleInputChange('requirement', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                    <option value="">{t('step1.selectRequirement')}</option>
                    {requirements.map((req) => (<option key={req} value={req}>{req}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {renderError('requirement')}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('step1.companyName')}<span className="text-red-500">*</span></label>
                <CompanySearch
                  value={formData.companyName}
                  onChange={(value) => handleInputChange('companyName', value)}
                  onSelect={handleCompanySelect}
                  placeholder={t('step1.companyNamePlaceholder')}
                />
                {renderError('companyName')}
                {formData.creditCode && (
                  <p className="text-xs text-green-600 flex items-center space-x-1">
                    <span>✓</span>
                    <span>{t('step1.autoFillSuccess')}</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step1.country')}<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                      <option value="">{t('step1.selectCountry')}</option>
                      {countries.map((country) => (<option key={country.value} value={country.value}>{country.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {renderError('country')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step1.province')}<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)} disabled={formData.country !== 'china'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none ${formData.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
                      <option value="">{t('step1.selectProvince')}</option>
                      {provinces.map((province) => (<option key={province.value} value={province.value}>{province.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {renderError('province')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step1.economicZone')} <span className="text-gray-400">({tCommon('optional')})</span></label>
                  <div className="relative">
                    <select value={formData.economicZone} onChange={(e) => handleInputChange('economicZone', e.target.value)} disabled={!formData.province || formData.country !== 'china'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none ${!formData.province || formData.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
                      <option value="">{t('step1.selectEconomicZone')}</option>
                      <option value="none">{t('step1.notInZone')}</option>
                      {developmentZones.map((zone) => (<option key={zone.value} value={zone.value}>{zone.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step1.logo')} <span className="text-gray-400">({tCommon('optional')})</span></label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">{formData.logoFile ? formData.logoFile.name : t('step1.selectFile')}</span>
                      </label>
                    </div>
                    {logoPreview && !formData.logoFile && (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <img src={logoPreview} alt="Logo预览" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{t('step1.logoPreview')}</p>
                          <p className="text-xs text-blue-600">{t('step1.logoPreviewDesc')}</p>
                        </div>
                      </div>
                    )}
                    {!logoPreview && !formData.logoFile && (
                      <p className="text-xs text-gray-500">{t('step1.logoHint')}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="button" onClick={handleNextStep} className="w-full py-3 px-6 rounded-lg font-medium text-lg transition-colors bg-[#00b899] hover:bg-[#009a7a] text-white">
                  {tCommon('nextStep')}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('step2.companyType')}<span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={formData.companyType} onChange={(e) => handleInputChange('companyType', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                    <option value="">{t('step2.selectCompanyType')}</option>
                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {params.locale === 'en' ? opt.label_en : opt.label_zh}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {renderError('companyType')}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('step2.address')} <span className="text-gray-400">({tCommon('optional')})</span></label>
                <input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('step2.addressPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step2.industryCode')} <span className="text-gray-400">({tCommon('optional')})</span></label>
                  <input type="text" value={formData.industryCode} onChange={(e) => handleInputChange('industryCode', e.target.value)} placeholder={t('step2.industryCodePlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step2.annualOutput')} <span className="text-gray-400">({tCommon('optional')})</span></label>
                  <input type="number" value={formData.annualOutput} onChange={(e) => handleInputChange('annualOutput', e.target.value)} placeholder={t('step2.annualOutputPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step2.contactPerson')}<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => handleInputChange('contactPerson', e.target.value)} placeholder={t('step2.contactPersonPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactPerson')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step2.contactPhone')}<span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.contactPhone} onChange={(e) => handleInputChange('contactPhone', e.target.value)} placeholder={t('step2.contactPhonePlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactPhone')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('step2.contactEmail')}<span className="text-red-500">*</span></label>
                  <input type="email" value={formData.contactEmail} onChange={(e) => handleInputChange('contactEmail', e.target.value)} placeholder={t('step2.contactEmailPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactEmail')}
                </div>
              </div>
              <div className="pt-6 flex items-center space-x-4">
                <button type="button" onClick={() => setStep(1)} className="w-1/2 py-3 px-6 rounded-lg font-medium text-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800">
                  {tCommon('previousStep')}
                </button>
                <button type="submit" disabled={submitLoading} className={`w-1/2 py-3 px-6 rounded-lg font-medium text-lg transition-colors ${submitLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00b899] hover:bg-[#009a7a]'} text-white`}>
                  {submitLoading ? tCommon('submitting') : tCommon('complete')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
