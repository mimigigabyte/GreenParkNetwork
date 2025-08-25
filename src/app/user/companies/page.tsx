'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';
import { CompactImageUpload } from '@/components/ui/compact-image-upload';
import { useAuthContext } from '@/components/auth/auth-provider';
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data';
import { COMPANY_TYPE_OPTIONS } from '@/lib/types/admin';

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

export default function UserCompaniesPage() {
  const { user } = useAuthContext();
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
          contactPhone: companyData.contact_phone || '',
          contactEmail: companyData.contact_email || ''
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
        <div className="text-lg font-medium text-gray-600">加载中...</div>
      </div>
    );
  }

  const { 
    countries, 
    provinces, 
    developmentZones 
  } = transformFilterDataForComponents(filterData);

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
    
    if (!companyInfo.companyName) newErrors.companyName = '请输入企业名称';
    if (!companyInfo.country) newErrors.country = '请选择国别';
    if (companyInfo.country === 'china' && !companyInfo.province) {
      newErrors.province = '请选择省份';
    }
    if (!companyInfo.companyType) newErrors.companyType = '请选择企业性质';
    if (!companyInfo.contactPerson) newErrors.contactPerson = '请输入联系人';
    if (!companyInfo.contactPhone) newErrors.contactPhone = '请输入联系电话';
    if (!companyInfo.contactEmail) newErrors.contactEmail = '请输入联系邮箱';
    
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
        alert('企业信息保存成功！');
        // 重新加载数据以显示最新信息
        await loadCompanyInfo();
      } else {
        throw new Error(response.error || '保存失败');
      }
    } catch (error) {
      console.error('保存企业信息失败:', error);
      alert('保存失败：' + (error instanceof Error ? error.message : '请稍后重试'));
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
          <h1 className="text-2xl font-bold text-gray-900">企业信息</h1>
          <p className="text-sm text-gray-600 mt-1">修改和完善您的企业信息</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            取消
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
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* 基本信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">企业名称</label>
                <input 
                  type="text" 
                  value={companyInfo.companyName} 
                  onChange={(e) => handleInputChange('companyName', e.target.value)} 
                  placeholder="请输入企业名称" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('companyName')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">上传企业Logo <span className="text-gray-400">(可选)</span></label>
                <CompactImageUpload
                  value={companyInfo.logoUrl}
                  onChange={(url) => handleInputChange('logoUrl', url)}
                  bucket="images"
                  folder="company-logos"
                  placeholder="选择文件"
                  maxSize={5}
                />
              </div>
            </div>
          </div>

          {/* 地址信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">地址信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">国别</label>
                <div className="relative">
                  <select 
                    value={companyInfo.country} 
                    onChange={(e) => handleInputChange('country', e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="">请选择国别</option>
                    {countries.map((country) => (
                      <option key={country.value} value={country.value}>{country.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('country')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">省份</label>
                <div className="relative">
                  <select 
                    value={companyInfo.province} 
                    onChange={(e) => handleInputChange('province', e.target.value)} 
                    disabled={companyInfo.country !== 'china'} 
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none ${
                      companyInfo.country !== 'china' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="">请选择省份</option>
                    {provinces.map((province) => (
                      <option key={province.value} value={province.value}>{province.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('province')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">所属国家级经开区 <span className="text-gray-400">(可选)</span></label>
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
                    <option value="">请选择经开区</option>
                    <option value="none">不位于国家级经开区内</option>
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
                <label className="block text-xs font-medium text-gray-700">详细地址 <span className="text-gray-400">(可选)</span></label>
                <input 
                  type="text" 
                  value={companyInfo.address} 
                  onChange={(e) => handleInputChange('address', e.target.value)} 
                  placeholder="请输入详细地址" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
            </div>
          </div>

          {/* 企业详情 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">企业详情</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">企业性质</label>
                <div className="relative">
                  <select 
                    value={companyInfo.companyType} 
                    onChange={(e) => handleInputChange('companyType', e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="">请选择企业性质</option>
                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label_zh}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {renderError('companyType')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">行业代码 <span className="text-gray-400">(可选)</span></label>
                <input 
                  type="text" 
                  value={companyInfo.industryCode} 
                  onChange={(e) => handleInputChange('industryCode', e.target.value)} 
                  placeholder="请输入行业代码" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">工业总产值(亿元) <span className="text-gray-400">(可选)</span></label>
                <input 
                  type="number" 
                  value={companyInfo.annualOutput} 
                  onChange={(e) => handleInputChange('annualOutput', e.target.value)} 
                  placeholder="请输入产值" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">联系信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">联系人</label>
                <input 
                  type="text" 
                  value={companyInfo.contactPerson} 
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)} 
                  placeholder="请输入联系人姓名" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('contactPerson')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">联系电话</label>
                <input 
                  type="tel" 
                  value={companyInfo.contactPhone} 
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)} 
                  placeholder="请输入联系电话" 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none" 
                />
                {renderError('contactPhone')}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">联系邮箱</label>
                <input 
                  type="email" 
                  value={companyInfo.contactEmail} 
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)} 
                  placeholder="请输入联系邮箱" 
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