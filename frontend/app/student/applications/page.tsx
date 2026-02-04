import { Suspense } from 'react';
import ApplicationsClient from './ApplicationsClient';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <ApplicationsClient />
    </Suspense>
  );
}
