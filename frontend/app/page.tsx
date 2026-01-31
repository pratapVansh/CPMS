'use client';

import Link from 'next/link';
import { Users, Briefcase, FileText, ClipboardList, GraduationCap, Building2 } from 'lucide-react';
import { institution } from '@/lib/design-system';
import { Card, LinkButton, AppFooter } from '@/components/common';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{institution.name}</h1>
                <p className="text-xs text-gray-600">{institution.systemFullName}</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Sign In
              </Link>
              <LinkButton href="/register" size="sm">
                Register
              </LinkButton>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {institution.systemFullName}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Official placement portal for students and the placement cell
            </p>
            <div className="flex justify-center gap-3">
              <LinkButton href="/login" leftIcon={<GraduationCap className="w-4 h-4" />}>
                Student Login
              </LinkButton>
              <LinkButton
                href="/login"
                variant="secondary"
                leftIcon={<Users className="w-4 h-4" />}
              >
                Admin Login
              </LinkButton>
            </div>
          </div>
        </section>

        {/* Information Section */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* For Students */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">For Students</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Apply to placement drives from registered companies</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Upload and manage resume and academic documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Track application status and placement results</span>
                </li>
              </ul>
            </Card>

            {/* For Placement Cell */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">For Placement Cell</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Create and manage placement drives</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>View registered students and their documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Track applications and update selection status</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Quick Info */}
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800 text-center">
              <strong>Note:</strong> This portal is for registered students and placement cell
              staff only. Please use your institute email credentials to log in.
            </p>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
