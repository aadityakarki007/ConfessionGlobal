'use client';

import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';

export default function AnalyticsWrapper() {
  const pathname = usePathname();

  // Skip analytics on admin pages and any admin sub-routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Analytics />;
}
