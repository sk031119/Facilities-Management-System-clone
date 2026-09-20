import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import UsersDataTable from '@/components/admin/users/UsersDataTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'ADMIN') {
    redirect('/admin');
  }

  const users = await db.user.findMany({
    include: {
      _count: {
        select: {
          sessions: true,
          maintenanceLogs: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <UsersDataTable
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          activeSessions: user._count.sessions,
          createdLogs: user._count.maintenanceLogs,
        }))}
      />
    </div>
  );
}
