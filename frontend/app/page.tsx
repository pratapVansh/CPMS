import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">CPMS</h1>
        <p className="text-xl text-gray-600 mb-8">
          College Placement Management System
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="btn btn-primary"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn btn-secondary"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
