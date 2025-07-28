import React from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/config/routes';
import { ProfileImage } from '@/shared/ui/ProfileImage';
import { Dropdown, DropdownItem, DropdownList, DropdownTrigger } from '@/shared/ui/dropdown';
import { HeaderLink } from './HeaderLink';

type Props = { session: Session | null; status: string };

const HeaderProfileDropdownMenu = ({ session, status }: Props) => {
  const router = useRouter();
  const handleClickSignOut = async () => {
    await signOut({ redirect: true });
    router.refresh();
  };

  const t = useTranslations('navigation');

  return (
    <Dropdown>
      {({ isOpen, toggle, onSelect: closeDropdown }) => (
        <div className="relative">
          <DropdownTrigger
            onClick={toggle}
            disabled={status === 'loading'}
            size="small"
            className="flex !w-auto items-center justify-center rounded-full px-1.5 py-0 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <ProfileImage
              url={session?.user?.image}
              size={40}
            />
          </DropdownTrigger>

          <DropdownList
            isOpen={isOpen}
            className="absolute top-full z-[var(--z-dropdown)] mt-1 !w-[120px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <DropdownItem
              value={'myPage'}
              onSelect={(value) => {
                closeDropdown(value);
              }}
              size="small"
              className={`!w-full cursor-pointer px-4 py-3 text-left`}
            >
              <div className="flex items-center justify-between">
                <HeaderLink
                  href={ROUTES.MY_PAGE}
                  className="text-sm font-medium"
                >
                  {t('myPage')}
                </HeaderLink>
              </div>
            </DropdownItem>

            <DropdownItem
              value={'logout'}
              onSelect={(value) => {
                closeDropdown(value);
              }}
              size="small"
              className={`!w-full cursor-pointer px-4 py-3 text-left`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClickSignOut}
                >
                  <span className="text-sm font-medium">{t('logout')}</span>
                </button>
              </div>
            </DropdownItem>
          </DropdownList>
        </div>
      )}
    </Dropdown>
  );
};

export default HeaderProfileDropdownMenu;
