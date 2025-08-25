import { useTranslations } from 'next-intl';

interface PageProps {
  params: { locale: string };
}

export default function ServerHomePage({ params: { locale } }: PageProps) {
  const t = useTranslations('home');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">{t('heroTitle')}</h1>
      <p className="text-lg mb-4">{t('heroSubtitle')}</p>
      <div className="space-y-2">
        <p>Current locale: {locale}</p>
        <p>Loading text: {t('loading')}</p>
        <p>Technology: {t('technology')}</p>
        <p>Categories: {t('categories')}</p>
      </div>
    </div>
  );
}