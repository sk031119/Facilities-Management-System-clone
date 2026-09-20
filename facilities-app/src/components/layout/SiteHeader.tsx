'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from '@/lib/auth-client';
import ThemeToggle from '@/components/ui/theme-toggle';
import { brandConfig } from '@/lib/brand';

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const lightLogo = brandConfig.logoLightPath ?? brandConfig.logoDarkPath;
  const darkLogo = brandConfig.logoDarkPath ?? brandConfig.logoLightPath;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b ${scrolled
          ? 'header-bg-scrolled border-white/20 dark:border-white/10'
          : 'header-bg border-[var(--fass-border)]'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Top row ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label={brandConfig.institutionName}>
            {lightLogo || darkLogo ? (
              <div className="flex h-10 items-center sm:h-12">
                {lightLogo ? (
                  <img
                    src={lightLogo}
                    alt={`${brandConfig.institutionName} logo`}
                    className="block h-full w-auto max-w-[250px] object-contain object-left dark:hidden sm:max-w-[340px]"
                  />
                ) : null}
                {darkLogo ? (
                  <img
                    src={darkLogo}
                    alt={`${brandConfig.institutionName} logo dark`}
                    className="hidden h-full w-auto max-w-[250px] object-contain object-left dark:block sm:max-w-[340px]"
                  />
                ) : null}
              </div>
            ) : (
              <div
                className="flex h-12 min-w-[148px] items-center justify-center rounded-2xl border px-4 shadow-sm sm:h-14"
                style={{
                  backgroundColor: 'var(--fass-bg-white)',
                  borderColor: 'var(--fass-accent-border)',
                }}
              >
                <span
                  className="text-sm font-bold text-[var(--fass-text)] sm:text-base"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {brandConfig.institutionName}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <Link
              href="/"
              className={`nav-link transition-colors py-1 font-medium ${isActive('/')
                  ? 'text-[var(--fass-blue)] nav-link-active'
                  : 'text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]'
                }`}
            >
              Room Finder
            </Link>
            <Link
              href="/campuses"
              className={`nav-link transition-colors py-1 font-medium ${isActive('/campuses')
                  ? 'text-[var(--fass-blue)] nav-link-active'
                  : 'text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]'
                }`}
            >
              Campus Maps
            </Link>
            <Link
              href="/api-docs"
              className={`nav-link transition-colors py-1 font-medium ${isActive('/api-docs')
                  ? 'text-[var(--fass-blue)] nav-link-active'
                  : 'text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]'
                }`}
            >
              API
            </Link>
            {session && (
              <Link
                href="/admin"
                className={`nav-link transition-colors py-1 font-medium ${isActive('/admin')
                    ? 'text-[var(--fass-blue)] nav-link-active'
                    : 'text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]'
                  }`}
              >
                Operations
              </Link>
            )}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <>
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">{session.user.name}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[var(--fass-border)] hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  onClick={() =>
                    signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })
                  }
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="gap-2 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:brightness-110"
                  style={{ backgroundColor: 'var(--fass-blue)' }}
                >
                  <User className="w-4 h-4" />
                  Facilities Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-[var(--fass-text-muted)] transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span className={`block transition-transform duration-200 ${mobileOpen ? 'rotate-90' : 'rotate-0'}`}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </span>
            </button>
          </div>
        </div>{/* ── end top row ── */}

        {/* ── Mobile dropdown menu ─────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--fass-border)] py-3 space-y-1 animate-slide-down">
            <Link
              href="/"
              className="flex items-center px-3 py-2.5 text-sm rounded-lg text-[var(--fass-text)] transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
              onClick={() => setMobileOpen(false)}
            >
              Room Finder
            </Link>
            <Link
              href="/campuses"
              className="flex items-center px-3 py-2.5 text-sm rounded-lg text-[var(--fass-text)] transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
              onClick={() => setMobileOpen(false)}
            >
              Campus Maps
            </Link>
            <Link
              href="/api-docs"
              className="flex items-center px-3 py-2.5 text-sm rounded-lg text-[var(--fass-text)] transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
              onClick={() => setMobileOpen(false)}
            >
              API
            </Link>
            {session ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center px-3 py-2.5 text-sm rounded-lg text-[var(--fass-text)] transition-colors hover:bg-[var(--fass-accent-soft)] hover:text-[var(--fass-blue)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Operations
                </Link>
                <button
                  className="flex w-full items-center px-3 py-2.5 text-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() =>
                    signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })
                  }
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center px-3 py-2.5 text-sm rounded-lg text-white font-semibold"
                style={{ backgroundColor: 'var(--fass-blue)' }}
                onClick={() => setMobileOpen(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Facilities Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
