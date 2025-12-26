import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get all active business profiles (using service role to bypass RLS)
    const { data: profiles, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json(profiles || []);
  } catch (error: any) {
    console.error('Error fetching business profiles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business profiles' },
      { status: 500 }
    );
  }
}

