import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import SiteHeader from '@/components/layout/SiteHeader';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect('/login');

  const role = (session.user as { role?: string }).role;
  if (role === 'PUBLIC') redirect('/login');

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1 min-w-0">
        <AdminSidebar />
        <main className="min-w-0 flex-1 bg-[color:color-mix(in_srgb,var(--fass-blue)_3%,transparent)]">
          <div className="mx-auto max-w-[1700px] p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
