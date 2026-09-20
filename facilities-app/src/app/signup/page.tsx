import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import SignupForm from '@/components/auth/SignupForm';
import { auth } from '@/lib/auth';
import { brandConfig } from '@/lib/brand';

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/admin');

  const lightLogo = brandConfig.logoLightPath ?? brandConfig.logoDarkPath;
  const darkLogo = brandConfig.logoDarkPath ?? brandConfig.logoLightPath;

  return (
    <div className="min-h-screen flex flex-col">
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

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#08111c] dark:via-[#0c1724] dark:to-[#111827]" />
        <div className="absolute left-1/4 top-1/4 h-72 w-72 animate-float rounded-full bg-[var(--fass-blue)]/10 blur-3xl pointer-events-none" />
        <div
          className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[var(--fass-yellow)]/10 blur-3xl pointer-events-none"
          style={{ animation: 'float 4.5s ease-in-out infinite reverse' }}
        />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/20 blur-3xl pointer-events-none dark:bg-[var(--fass-blue)]/8" />

        <div className="relative z-10 flex w-full justify-center">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
