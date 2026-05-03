import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DashboardShellWrapper } from '@/components/common/dashboard-shell-wrapper';
import { COOKIE_REFRESH_TOKEN } from '@/lib/auth/cookies';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get(COOKIE_REFRESH_TOKEN)) {
    redirect('/login');
  }
  return <DashboardShellWrapper>{children}</DashboardShellWrapper>;
}
