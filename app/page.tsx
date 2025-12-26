import { redirect } from 'next/navigation';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import Dashboard from '@/components/dashboard/Dashboard';

export default async function HomePage() {
  const supabase = await getSupabaseUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return <Dashboard />;
}

