'use client';

import { useTranslations } from 'next-intl';
import { useGetUser } from '@/entities/user/api';
import { ProfileImage } from '@/shared/ui/ProfileImage';
import { ProfileBGIcon } from '@/shared/ui/icon';
import { ProfileEditBtn } from './ProfileEditBtn';

export const ProfileSection = () => {
  const t = useTranslations('pages.myPage');

  // auth/user 회원 정보 조회
  const { data: user } = useGetUser();

  return (
    <div className="flex h-38 w-full flex-col overflow-hidden rounded-2xl border border-gray-100">
      <div className="flex flex-1 items-center justify-between bg-orange-400 px-4">
        <h2 className="text-lg font-semibold">{t('profile.title')}</h2>
        <div className="tablet:gap-10 web:gap-20 flex items-center gap-2">
          <ProfileBGIcon className="self-end" />
          <ProfileEditBtn
            companyName={user?.companyName ?? ''}
            email={user?.email ?? ''}
          />
        </div>
      </div>
      <div className="h-2 border-t-2 border-t-orange-500 bg-orange-400" />

      <div className="flex flex-2 gap-2 bg-white px-5">
        <ProfileImage
          url={user?.image}
          size={56}
          className="-translate-y-3"
        />
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">{user?.name}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{t('profile.company')}</span>
            <p className="text-sm font-medium">{user?.companyName}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">{t('profile.email')}</span>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
