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
            className="flex !w-auto items-center justify-center rounded-full transition-colors hover:border-gray-300 hover:bg-gray-50"
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
              className={`w-full p-0`}
            >
              <HeaderLink
                href={ROUTES.MY_PAGE}
                className="flex h-full w-full items-center px-4 py-3 text-sm font-medium"
              >
                {t('myPage')}
              </HeaderLink>
            </DropdownItem>

            <DropdownItem
              value={'logout'}
              onSelect={(value) => {
                closeDropdown(value);
              }}
              size="small"
              className={`left w-full p-0`}
            >
              <button
                type="button"
                onClick={handleClickSignOut}
                className="t w-full cursor-pointer px-4 py-3 text-left"
              >
                <span className="text-sm font-medium">{t('logout')}</span>
              </button>
            </DropdownItem>
          </DropdownList>
        </div>
      )}
    </Dropdown>
  );
};

export default HeaderProfileDropdownMenu;
