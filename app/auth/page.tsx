'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  
  // Temporarily redirect to home - auth disabled for testing
  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
