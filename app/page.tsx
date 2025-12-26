import { redirect } from 'next/navigation';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import Dashboard from '@/components/dashboard/Dashboard';

export default async function HomePage() {
  // Development bypass: Set NEXT_PUBLIC_BYPASS_AUTH=true to skip authentication
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
  
  if (!bypassAuth) {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth');
    }
  }

  return <Dashboard />;
}

