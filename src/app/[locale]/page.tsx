import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

/**
 * Renders the home page with localized title and welcome message based on the provided locale.
 *
 * Awaits the `params` prop to extract the locale, retrieves translations for the home page namespace, and displays the localized title and welcome text.
 */
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
