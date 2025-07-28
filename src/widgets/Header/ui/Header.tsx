'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/shared/config/routes';
import { HeaderLink } from './HeaderLink';
import HeaderProfileDropdownMenu from './HeaderProfileDropdownMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { MobileGNB } from './MobileGNB';

export const Header = () => {
  const t = useTranslations('navigation');
  const { status, data: session } = useSession();
  // const session = getSession();
  console.log({ session }, status, session?.user?.id, session?.user.image);

  // useEffect(() => {
  //   if (status === 'authenticated' && session) {
  //     // session.expires 는 ISO 문자열
  //     const expiresAt = new Date(session.expires);
  //     console.log('세션 만료 시각:', expiresAt);
  //   }
  //   async function getSessionData() {
  //     const session2 = await getSession();
  //     console.log({ session2 });
  //   }
  //   getSessionData();
  // }, [session, status]);

  return (
    <header className="tablet:h-15 px-mobile-padding tablet:px-tablet-padding fixed z-[var(--z-sticky)] flex h-14 w-full justify-center gap-5 border-b border-gray-200 bg-white">
      <div className="web:max-w-web flex w-full items-center justify-between">
        <div className="flex items-center gap-5">
          <MobileGNB />
          <Logo className="tablet:h-15 tablet:relative tablet:left-0 tablet:-translate-x-0 absolute top-0 left-1/2 h-14 -translate-x-1/2 content-center justify-self-center" />

          <nav className="tablet:flex hidden gap-6">
            <HeaderLink href={ROUTES.GATHERING}>{t('findGatherings')}</HeaderLink>
            <HeaderLink href={ROUTES.FAVORITE}>{t('favoriteGatherings')}</HeaderLink>
            <HeaderLink href={ROUTES.REVIEW}>{t('allReviews')}</HeaderLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {status === 'loading' ? (
            <></>
          ) : status === 'authenticated' ? (
            <HeaderProfileDropdownMenu
              session={session}
              status={status}
            />
          ) : (
            <HeaderLink
              className="bg-primary w-18 rounded-[5px] px-2.5 py-1 text-center font-semibold whitespace-nowrap text-white hover:bg-orange-600"
              href={ROUTES.SIGNIN}
            >
              {t('signin')}
            </HeaderLink>
          )}
        </div>
      </div>
    </header>
  );
};
