import { AuthProvider } from '@/components/auth/auth-provider';
import { locales } from '@/i18n/request';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  // 验证语言参数
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
  
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextIntlClientProvider>
  );
}