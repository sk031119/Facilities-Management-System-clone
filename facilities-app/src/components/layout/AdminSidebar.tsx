'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, DoorOpen, Building2, Tag, MapPinned, Wrench, BookOpenText, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navSections = [
  {
    label: 'Monitor',
    items: [
      { href: '/admin', label: 'Operations Overview', icon: LayoutDashboard, exact: true, adminOnly: false },
    ],
  },
  {
    label: 'Room Setup',
    items: [
      { href: '/admin/rooms', label: 'Room Directory', icon: DoorOpen, exact: false, adminOnly: true },
      { href: '/admin/campuses', label: 'Campus', icon: MapPinned, exact: false, adminOnly: true },
      { href: '/admin/buildings', label: 'Building Portfolio', icon: Building2, exact: false, adminOnly: true },
    ],
  },
  {
    label: 'Service',
    items: [
      { href: '/admin/maintenance', label: 'Service Desk', icon: Wrench, exact: false, adminOnly: false },
      { href: '/admin/tags', label: 'Room Labels', icon: Tag, exact: false, adminOnly: false },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/admin/users', label: 'Users & Access', icon: ShieldCheck, exact: false, adminOnly: true },
      { href: '/api-docs', label: 'API', icon: BookOpenText, exact: false, adminOnly: false },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Monitor: true,
    'Room Setup': true,
    Service: true,
    Platform: true,
  });

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !(item.adminOnly && role !== 'ADMIN')),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="hidden w-80 shrink-0 border-r border-[var(--fass-border)] bg-white md:sticky md:top-16 md:flex md:h-[calc(100vh-4rem)] md:flex-col">
      <nav className="flex-1 space-y-2 overflow-y-auto p-3 pt-4">
        {visibleSections.map((section) => (
          <div key={section.label} className="rounded-2xl border border-[var(--fass-border)]/70 bg-[var(--fass-bg-light)]/60">
            <Collapsible
              open={openSections[section.label]}
              onOpenChange={(open) =>
                setOpenSections((current) => ({ ...current, [section.label]: open }))
              }
            >
              <CollapsibleTrigger className="w-full text-left">
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">
                    {section.label}
                  </p>
                  {openSections[section.label] ? (
                    <ChevronDown className="h-4 w-4 text-[var(--fass-text-muted)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--fass-text-muted)]" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 px-2 pb-2">
                  {section.items.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          'group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm transition-all duration-200',
                          active
                            ? 'text-white font-semibold shadow-sm'
                            : 'text-[var(--fass-text-muted)] hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]'
                        )}
                        style={
                          active
                            ? { background: 'linear-gradient(135deg, var(--fass-blue), var(--fass-blue-dark))' }
                            : undefined
                        }
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200',
                            active ? 'text-white' : 'group-hover:scale-110'
                          )}
                        />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </nav>

    </aside>
  );
}
