'use client'

import { useState, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Language } from '@/lib/types/admin'

interface LanguageTabsProps {
  children: (language: Language) => ReactNode
  defaultLanguage?: Language
  className?: string
}

export function LanguageTabs({ 
  children, 
  defaultLanguage = 'zh',
  className = '' 
}: LanguageTabsProps) {
  const [activeLanguage, setActiveLanguage] = useState<Language>(defaultLanguage)

  const languages = [
    { key: 'zh' as Language, label: '中文', flag: '🇨🇳' },
    { key: 'en' as Language, label: 'English', flag: '🇺🇸' }
  ]

  return (
    <div className={className}>
      {/* 语言切换标签 */}
      <div className="flex space-x-1 mb-4">
        {languages.map((language) => (
          <button
            key={language.key}
            onClick={() => setActiveLanguage(language.key)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeLanguage === language.key
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.label}
          </button>
        ))}
      </div>

      {/* 语言内容 */}
      <div className="space-y-4">
        {children(activeLanguage)}
      </div>
    </div>
  )
}

interface LanguageFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  type?: 'input' | 'textarea'
  rows?: number
  allowClear?: boolean
}

export function LanguageField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  type = 'input',
  rows = 3,
  allowClear = true
}: LanguageFieldProps) {
  const baseClassName = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${allowClear && value ? 'pr-10' : ''}`

  const handleClear = () => {
    onChange('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={baseClassName}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseClassName}
          />
        )}
        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="清除内容"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}