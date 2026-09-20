import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { brandConfig } from '@/lib/brand';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/admin');
  const params = await searchParams;
  const registered = params?.registered === '1';
  const lightLogo = brandConfig.logoLightPath ?? brandConfig.logoDarkPath;
  const darkLogo = brandConfig.logoDarkPath ?? brandConfig.logoLightPath;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="glass border-b border-[var(--fass-border)] py-4 px-6 animate-fade-in-down">
        <Link href="/" className="flex items-center w-fit group" aria-label={brandConfig.institutionName}>
          {lightLogo ? (
            <img
              src={lightLogo}
              alt={`${brandConfig.institutionName} logo`}
              className="block h-10 w-auto max-w-[240px] object-contain object-left dark:hidden sm:h-12 sm:max-w-[320px]"
            />
          ) : null}
          {darkLogo ? (
            <img
              src={darkLogo}
              alt={`${brandConfig.institutionName} logo dark`}
              className="hidden h-10 w-auto max-w-[240px] object-contain object-left dark:block sm:h-12 sm:max-w-[320px]"
            />
          ) : null}
        </Link>
      </header>

      {/* Background */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#08111c] dark:via-[#0c1724] dark:to-[#111827]" />

        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--fass-blue)]/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--fass-yellow)]/10 rounded-full blur-3xl pointer-events-none"
          style={{ animation: 'float 4.5s ease-in-out infinite reverse' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/20 dark:bg-[var(--fass-blue)]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full flex justify-center">
          <LoginForm registered={registered} />
        </div>
      </div>
    </div>
  );
}
