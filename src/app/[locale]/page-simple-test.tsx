'use client';

import { useTranslations } from 'next-intl';

interface PageProps {
  params: { locale: string };
}

export default function SimpleTestPage({ params }: PageProps) {
  const t = useTranslations('header');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">
        {t('platformName')}
      </h1>
      <p className="mb-2">Current locale: {params.locale}</p>
      <p className="mb-2">Chinese: {t('chinese')}</p>
      <p className="mb-2">English: {t('english')}</p>
    </div>
  );
}