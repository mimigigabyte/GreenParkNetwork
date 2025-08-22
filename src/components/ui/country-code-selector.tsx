'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CountryCodeOption {
  code: string;
  name: string;
  flag: string;
}

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

const countryOptions: CountryCodeOption[] = [
  { code: '+86', name: '中国', flag: '🇨🇳' },
  { code: '+852', name: '香港', flag: '🇭🇰' },
  { code: '+853', name: '澳门', flag: '🇲🇴' },
  { code: '+886', name: '台湾', flag: '🇹🇼' },
  { code: '+1', name: '美国', flag: '🇺🇸' },
  { code: '+44', name: '英国', flag: '🇬🇧' },
  { code: '+81', name: '日本', flag: '🇯🇵' },
  { code: '+82', name: '韩国', flag: '🇰🇷' },
  { code: '+65', name: '新加坡', flag: '🇸🇬' },
  { code: '+60', name: '马来西亚', flag: '🇲🇾' },
  { code: '+66', name: '泰国', flag: '🇹🇭' },
  { code: '+91', name: '印度', flag: '🇮🇳' },
  { code: '+61', name: '澳大利亚', flag: '🇦🇺' },
  { code: '+49', name: '德国', flag: '🇩🇪' },
  { code: '+33', name: '法国', flag: '🇫🇷' },
];

export function CountryCodeSelector({ value, onChange, className = '' }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = countryOptions.find(option => option.code === value) || countryOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-3 bg-gray-50 border-r border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px] justify-between"
      >
        <div className="flex items-center space-x-1">
          <span className="text-base">{selectedOption.flag}</span>
          <span className="text-gray-700 font-medium text-sm">{selectedOption.code}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {countryOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 ${
                option.code === value ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <span className="text-base">{option.flag}</span>
              <span className="font-medium text-sm">{option.code}</span>
              <span className="text-gray-600 text-sm">{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}