'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock, Mail, User } from 'lucide-react';
import { signOut, signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const result = await signUp.email({
      name,
      email,
      password,
      callbackURL: '/login?registered=1',
    });

    if (result.error) {
      setLoading(false);
      setError(result.error.message ?? 'Unable to create account.');
      return;
    }

    try {
      await signOut();
    } catch {
      // Ignore if Better Auth did not create a session during sign-up.
    }

    setLoading(false);
    router.push('/login?registered=1');
    router.refresh();
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
              Create facilities account
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-6 text-white/82">
              Register a new account to access public facilities tools and request elevated access if needed.
            </p>
          </div>
        </div>

        <div className="px-8 py-7 bg-[var(--fass-bg-white)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-3 text-sm text-[var(--fass-text-muted)]">
              New accounts are created with <span className="font-semibold text-[var(--fass-text)]">PUBLIC</span> access
              by default. Admin approval is still required for operations pages.
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-[var(--fass-text)]">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 placeholder:text-[var(--fass-text-muted)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm font-medium text-[var(--fass-text)]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
                <Input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@fass.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 placeholder:text-[var(--fass-text-muted)]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-sm font-medium text-[var(--fass-text)]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 placeholder:text-[var(--fass-text-muted)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-[var(--fass-text)]">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 border-[var(--fass-border)] bg-[var(--fass-bg-white)] focus:border-[var(--fass-blue)] focus:ring-[var(--fass-blue)]/20 placeholder:text-[var(--fass-text-muted)]"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-xl bg-[var(--fass-blue)] text-white shadow-md transition-all duration-300 hover:bg-[var(--fass-blue-dark)] hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <div className="flex items-center justify-between gap-3 pt-1 text-sm">
              <span className="text-[var(--fass-text-muted)]">Already registered?</span>
              <Link
                href="/login"
                className="font-medium text-[var(--fass-blue)] transition-colors hover:text-[var(--fass-blue-dark)]"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
