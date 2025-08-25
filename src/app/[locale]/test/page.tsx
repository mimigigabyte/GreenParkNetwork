'use client';

import { useTranslations } from 'next-intl';

interface PageProps {
  params: { locale: string };
}

export default function TestPage({ params }: PageProps) {
  const t = useTranslations('common');
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>Locale: {params.locale}</p>
      <p>Loading text: {t('loading')}</p>
    </div>
  );
}