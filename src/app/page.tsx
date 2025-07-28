import { redirect, routing } from '@/i18n';
import { ROUTES } from '@/shared/config/routes';

export default async function RootPage() {
  // 기본 locale로 리다이렉트
  redirect({ href: ROUTES.GATHERING, locale: routing.defaultLocale });
}
