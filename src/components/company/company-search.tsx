'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, User } from 'lucide-react';

export interface CompanySearchResult {
  id: string;
  name: string;
  creditCode: string;
  legalRepresentative: string;
  registeredDate: string;
  status: string;
  registrationNumber: string;
  address: string;
}

interface CompanySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (company: CompanySearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function CompanySearch({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "请输入企业名称", 
  className = "" 
}: CompanySearchProps) {
  const [suggestions, setSuggestions] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && value.length >= 2) {
        searchCompanies(value);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
        setSearchError('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCompanies = async (searchKey: string) => {
    setIsLoading(true);
    setSearchError('');

    try {
      const response = await fetch(`/api/company/search?q=${encodeURIComponent(searchKey)}`);
      const result = await response.json();

      if (result.success) {
        setSuggestions(result.data || []);
        setShowDropdown(true);
      } else {
        setSearchError(result.error || '搜索失败');
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('企业搜索失败:', error);
      setSearchError('网络错误，请稍后重试');
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelectCompany = (company: CompanySearchResult) => {
    onChange(company.name);
    onSelect(company);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''} text-gray-400`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00b899]"></div>
          </div>
        )}
      </div>

      {/* 搜索提示下拉框 */}
      {(showDropdown || searchError) && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {searchError ? (
            <div className="p-4 text-red-500 text-sm text-center">
              <div className="flex items-center justify-center space-x-2">
                <span>⚠️</span>
                <span>{searchError}</span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-[#00b899] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {company.name}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {company.legalRepresentative && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{company.legalRepresentative}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            company.status === '存续' || company.status === '在业' 
                              ? 'bg-green-400' 
                              : 'bg-gray-400'
                          }`}></span>
                          <span>{company.status}</span>
                        </div>
                      </div>
                      {company.address && (
                        <div className="flex items-start space-x-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-gray-500 text-sm text-center">
              未找到匹配的企业信息
            </div>
          )}
        </div>
      )}
    </div>
  );
}