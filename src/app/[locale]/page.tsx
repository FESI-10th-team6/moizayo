import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.home' });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-xl text-gray-600">{t('welcome')}</p>
    </div>
  );
}
