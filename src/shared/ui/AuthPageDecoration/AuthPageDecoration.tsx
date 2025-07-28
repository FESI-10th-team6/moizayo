'use client';

import { useTranslations } from 'next-intl';
import { useAuthImageSize } from '@/shared/hooks/useAuthImageSize';
import { LoginImageIcon } from '../icon';

export const AuthPageDecoration = () => {
  const t = useTranslations('pages.signin');
  const size = useAuthImageSize();

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800">{t('welcome')}</h2>
      <p className="text-base">
        {t('desc1')} <br />
        {t('desc2')}
      </p>

      <LoginImageIcon size={size} />
    </>
  );
};
