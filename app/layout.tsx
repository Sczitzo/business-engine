import type { Metadata } from 'next';
import './globals.css';
import { runStartupChecks } from './startup-check';

// Validate environment on server startup
if (typeof window === 'undefined') {
  try {
    runStartupChecks();
  } catch (error) {
    console.error('Startup validation failed. Please check your environment variables.');
  }
}

export const metadata: Metadata = {
  title: 'Business Engine',
  description: 'Multi-tenant business platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

