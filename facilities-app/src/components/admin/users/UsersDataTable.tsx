'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Filter, Search, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSession } from '@/lib/auth-client';
import type { UserRole } from '@/types';

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
  createdLogs: number;
};

const roleMeta: Record<UserRole, { label: string; tone: string }> = {
  ADMIN: {
    label: 'Admin',
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  STAFF: {
    label: 'Staff',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  PUBLIC: {
    label: 'Public',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

export default function UsersDataTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalized.length === 0 ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [deferredSearch, roleFilter, users]);

  const currentUserId = session?.user.id;

  async function updateRole(userId: string, role: UserRole) {
    setSavingRoleFor(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Unable to update role');
      }

      router.refresh();
    } catch {
      alert('Could not update this user role. Please try again.');
    } finally {
      setSavingRoleFor(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[var(--fass-blue)]" />
              <p className="text-xl font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Users & access
              </p>
            </div>

            <Badge variant="outline" className="rounded-full px-3 py-1">
              {filtered.length} visible
            </Badge>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1.15fr)_minmax(180px,0.7fr)_auto] xl:items-center">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] pl-9"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
              >
                <option value="all">All roles</option>
                <option value="ADMIN">Admins</option>
                <option value="STAFF">Staff</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-3 py-2 text-xs text-[var(--fass-text-muted)]">
              <Filter className="h-3.5 w-3.5 text-[var(--fass-blue)]" />
              Self-signup accounts start as PUBLIC until an admin changes the role.
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--fass-border)] bg-white shadow-sm">
        <div className="overflow-x-auto px-6 py-4 lg:px-7">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[var(--fass-text-muted)]">
                    No users matched the current search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--fass-text)]">{user.name}</p>
                        <p className="text-sm text-[var(--fass-text-muted)]">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleMeta[user.role].tone}>
                        {roleMeta[user.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.emailVerified
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }
                      >
                        {user.emailVerified ? (
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                        )}
                        {user.emailVerified ? 'Verified' : 'Not verified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">{user.activeSessions}</TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--fass-blue)]" />
                        {user.createdLogs} maintenance records
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentUserId === user.id ? (
                          <Badge
                            variant="outline"
                            className="border-[var(--fass-border)] bg-[var(--fass-bg-light)] text-[var(--fass-text-muted)]"
                          >
                            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-[var(--fass-blue)]" />
                            Current admin
                          </Badge>
                        ) : null}

                        <div className="relative min-w-[140px]">
                          <select
                            className="enterprise-native-select h-9 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-9 text-sm text-[var(--fass-text)] outline-none"
                            value={user.role}
                            disabled={savingRoleFor === user.id || currentUserId === user.id}
                            onChange={(event) => updateRole(user.id, event.target.value as UserRole)}
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="STAFF">Staff</option>
                            <option value="PUBLIC">Public</option>
                          </select>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
