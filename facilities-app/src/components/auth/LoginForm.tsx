'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Mail, Lock } from 'lucide-react';

type LoginFormProps = {
  registered?: boolean;
};

export default function LoginForm({ registered = false }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn.email({
      email,
      password,
      callbackURL: '/admin',
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? 'Invalid email or password.');
    } else {
      router.push('/admin');
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--fass-border)] bg-[var(--fass-bg-white)] shadow-2xl">
        <div className="px-8 py-8 text-center relative bg-[linear-gradient(135deg,#000033_0%,#00154d_38%,#004b8f_82%,#007ACC_100%)]">
          <div className="relative z-10 space-y-3">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Facilities login
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-6 text-white/82">
              Sign in to access facilities operations and room management tools.
            </p>
          </div>
        </div>

        <div className="px-8 py-7 bg-[var(--fass-bg-white)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {registered && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                Account created. Sign in with your new credentials. New accounts start with limited public access
                until an admin or staff member updates the role.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 animate-scale-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--fass-text)]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fass-text-muted)]" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@fass.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 transition-all placeholder:text-[var(--fass-text-muted)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--fass-text)]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fass-text-muted)]" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 transition-all placeholder:text-[var(--fass-text-muted)]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--fass-blue)] hover:bg-[var(--fass-blue-dark)] text-white btn-shimmer shadow-md hover:shadow-lg transition-all duration-300 rounded-xl h-10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="flex items-center justify-between gap-3 pt-1 text-sm">
              <span className="text-[var(--fass-text-muted)]">Need an account?</span>
              <Link
                href="/signup"
                className="font-medium text-[var(--fass-blue)] transition-colors hover:text-[var(--fass-blue-dark)]"
              >
                Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
