'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { login } from '@/lib/auth';
import { institution } from '@/lib/design-system';
import { Card, Button, Input, FormGroup, AppFooter } from '@/components/common';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginType = searchParams.get('type') || 'student';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });

    if (result.success && result.user) {
      if (result.user.role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else if (result.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{institution.name}</h1>
              <p className="text-xs text-gray-600">{institution.systemFullName}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your credentials to access the portal
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@rgipt.ac.in"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <Button type="submit" loading={loading} fullWidth>
                  Sign In
                </Button>
              </FormGroup>
            </form>

            {loginType === 'student' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-blue-600 hover:underline font-medium">
                    Register here
                  </Link>
                </p>
              </div>
            )}
          </Card>

          <p className="mt-6 text-center text-xs text-gray-500">
            For login issues, contact the {institution.department}.
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
