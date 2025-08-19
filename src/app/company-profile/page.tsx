'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Upload, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { submitCompanyProfile, CompanyProfileData } from '@/api/company';
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data';
import { COMPANY_TYPE_OPTIONS } from '@/lib/types/admin';
import { generateCompanyLogo } from '@/lib/logoGenerator';
import { useAuthContext } from '@/components/auth/auth-provider';
import { CompanySearch, CompanySearchResult } from '@/components/company/company-search';

export default function CompanyProfilePage() {
  const router = useRouter();
  const { user } = useAuthContext();
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
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactPhone: user.phone || '',
        contactEmail: user.email || ''
      }));
    }
  }, [user]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const requirements = [
    '发布我的绿色低碳技术',
    '寻找特定绿色低碳技术',
    '了解业界前沿动态'
  ];

  const { 
    data: filterData, 
    isLoading: isLoadingFilter, 
    loadProvinces, 
    loadDevelopmentZones 
  } = useFilterData();

  if (isLoadingFilter) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600">加载中...</div>
      </div>
    );
  }

  const { 
    countries, 
    provinces, 
    developmentZones 
  } = transformFilterDataForComponents(filterData);

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
      const selectedCountry = countries.find(c => c.value === value);
      if (selectedCountry && selectedCountry.value === 'china') {
        const chinaCountry = filterData.countries.find(c => c.code === 'china');
        if (chinaCountry) {
          loadProvinces(chinaCountry.id);
        }
      } else {
        // 如果选择的不是中国，清空省份和经开区
        setFormData(prev => ({ ...prev, province: '', economicZone: '' }));
      }
    }

    if (field === 'province') {
      const selectedProvince = filterData.provinces.find(p => p.code === value);
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
      if (!formData.requirement) newErrors.requirement = '请选择您的需求';
      if (!formData.companyName) newErrors.companyName = '请输入企业名称';
      if (!formData.country) newErrors.country = '请选择国别';
      if (formData.country === 'china' && !formData.province) {
        newErrors.province = '请选择省份';
      }
    } else if (currentStep === 2) {
      if (!formData.companyType) newErrors.companyType = '请选择企业性质';
      if (!formData.contactPerson) newErrors.contactPerson = '请输入联系人';
      if (!formData.contactPhone) newErrors.contactPhone = '请输入联系电话';
      if (!formData.contactEmail) newErrors.contactEmail = '请输入联系邮箱';
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
        alert('企业信息提交成功！即将跳转到首页...');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请稍后重试');
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">企业信息完善</h1>
          <p className="text-gray-600">完善信息，即刻开启绿色低碳之旅 (第 {step}/2 步)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">您的需求<span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={formData.requirement} onChange={(e) => handleInputChange('requirement', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                    <option value="">请选择您的需求</option>
                    {requirements.map((req) => (<option key={req} value={req}>{req}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {renderError('requirement')}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">企业名称<span className="text-red-500">*</span></label>
                <CompanySearch
                  value={formData.companyName}
                  onChange={(value) => handleInputChange('companyName', value)}
                  onSelect={handleCompanySelect}
                  placeholder="请输入企业名称，系统将自动搜索匹配"
                />
                {renderError('companyName')}
                {formData.creditCode && (
                  <p className="text-xs text-green-600 flex items-center space-x-1">
                    <span>✓</span>
                    <span>已自动获取企业工商信息</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">国别<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                      <option value="">请选择国别</option>
                      {countries.map((country) => (<option key={country.value} value={country.value}>{country.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {renderError('country')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">省份<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)} disabled={formData.country !== 'china'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none ${formData.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
                      <option value="">请选择省份</option>
                      {provinces.map((province) => (<option key={province.value} value={province.value}>{province.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {renderError('province')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">所属国家级经开区 <span className="text-gray-400">(可选)</span></label>
                  <div className="relative">
                    <select value={formData.economicZone} onChange={(e) => handleInputChange('economicZone', e.target.value)} disabled={!formData.province || formData.country !== 'china'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none ${!formData.province || formData.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
                      <option value="">请选择经开区</option>
                      <option value="none">不位于国家级经开区内</option>
                      {developmentZones.map((zone) => (<option key={zone.value} value={zone.value}>{zone.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">上传企业Logo <span className="text-gray-400">(可选)</span></label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">{formData.logoFile ? formData.logoFile.name : '选择文件'}</span>
                      </label>
                    </div>
                    {logoPreview && !formData.logoFile && (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <img src={logoPreview} alt="Logo预览" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">系统生成预览</p>
                          <p className="text-xs text-blue-600">系统将根据企业名称自动生成logo，您也可以上传自定义logo</p>
                        </div>
                      </div>
                    )}
                    {!logoPreview && !formData.logoFile && (
                      <p className="text-xs text-gray-500">建议上传 PNG 或 JPG 格式，尺寸不超过 2MB</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="button" onClick={handleNextStep} className="w-full py-3 px-6 rounded-lg font-medium text-lg transition-colors bg-[#00b899] hover:bg-[#009a7a] text-white">
                  下一步
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">企业性质<span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={formData.companyType} onChange={(e) => handleInputChange('companyType', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none appearance-none bg-white">
                    <option value="">请选择企业性质</option>
                    {COMPANY_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label_zh}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {renderError('companyType')}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">地址信息 <span className="text-gray-400">(可选)</span></label>
                <input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="请输入详细地址" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">行业代码 <span className="text-gray-400">(可选)</span></label>
                  <input type="text" value={formData.industryCode} onChange={(e) => handleInputChange('industryCode', e.target.value)} placeholder="请输入行业代码" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">工业总产值(亿元) <span className="text-gray-400">(可选)</span></label>
                  <input type="number" value={formData.annualOutput} onChange={(e) => handleInputChange('annualOutput', e.target.value)} placeholder="请输入产值" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">联系人<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => handleInputChange('contactPerson', e.target.value)} placeholder="请输入联系人姓名" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactPerson')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">联系电话<span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.contactPhone} onChange={(e) => handleInputChange('contactPhone', e.target.value)} placeholder="请输入联系电话" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactPhone')}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">联系邮箱<span className="text-red-500">*</span></label>
                  <input type="email" value={formData.contactEmail} onChange={(e) => handleInputChange('contactEmail', e.target.value)} placeholder="请输入联系邮箱" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none" />
                  {renderError('contactEmail')}
                </div>
              </div>
              <div className="pt-6 flex items-center space-x-4">
                <button type="button" onClick={() => setStep(1)} className="w-1/2 py-3 px-6 rounded-lg font-medium text-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800">
                  上一步
                </button>
                <button type="submit" disabled={submitLoading} className={`w-1/2 py-3 px-6 rounded-lg font-medium text-lg transition-colors ${submitLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00b899] hover:bg-[#009a7a]'} text-white`}>
                  {submitLoading ? '提交中...' : '完成确认'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
