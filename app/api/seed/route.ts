import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // 1. Create a demo organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Demo Company',
        slug: 'demo-company',
      })
      .select()
      .single();

    let organizationId: string;
    if (org) {
      organizationId = org.id;
    } else {
      // Try to get existing
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'demo-company')
        .single();
      
      if (!existingOrg) {
        throw new Error('Failed to create or find organization');
      }
      organizationId = existingOrg.id;
    }

    // 2. Create a demo user (using a fixed UUID)
    const demoUserId = '00000000-0000-0000-0000-000000000001';
    
    await supabase
      .from('users')
      .upsert({
        id: demoUserId,
        email: 'demo@businessengine.com',
        full_name: 'Demo User',
      }, {
        onConflict: 'id',
      });

    // 3. Add user to organization
    await supabase
      .from('organization_members')
      .upsert({
        organization_id: organizationId,
        user_id: demoUserId,
        role: 'owner',
      }, {
        onConflict: 'organization_id,user_id',
      });

    // 4. Create business profiles
    const businessProfiles = [
      {
        organization_id: organizationId,
        name: 'Tech Blog',
        description: 'Technology and software development content',
        market: 'B2B SaaS',
        platforms: ['YouTube', 'Medium', 'Twitter'],
        risk_level: 'low',
        compliance_flags: [],
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: 'E-commerce Brand',
        description: 'Online retail and product marketing',
        market: 'E-commerce',
        platforms: ['Instagram', 'TikTok', 'Facebook'],
        risk_level: 'medium',
        compliance_flags: ['GDPR'],
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: 'Content Creator',
        description: 'Personal brand and lifestyle content',
        market: 'Content Creator',
        platforms: ['YouTube', 'Instagram', 'TikTok'],
        risk_level: 'low',
        compliance_flags: ['COPPA'],
        is_active: true,
      },
    ];

    const createdProfiles = [];
    for (const profile of businessProfiles) {
      const { data: existing } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', profile.name)
        .single();

      if (existing) {
        createdProfiles.push(existing);
      } else {
        const { data: newProfile } = await supabase
          .from('business_profiles')
          .insert(profile)
          .select()
          .single();

        if (newProfile) {
          createdProfiles.push(newProfile);
        }
      }
    }

    // Get profiles if none were created
    if (createdProfiles.length === 0) {
      const { data: existing } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(3);
      
      if (existing) {
        createdProfiles.push(...existing);
      }
    }

    // 5. Create content packs for the first business profile
    if (createdProfiles.length > 0) {
      const firstProfile = createdProfiles[0];

      const contentPacks = [
        {
          business_profile_id: firstProfile.id,
          created_by: demoUserId,
          title: 'Getting Started with Next.js 14',
          description: 'A comprehensive guide to Next.js 14 features',
          content_type: 'post',
          content_data: {
            body: 'Next.js 14 introduces exciting new features including the App Router, Server Components, and improved performance. In this guide, we\'ll explore how to get started...',
            tags: ['nextjs', 'react', 'web-development'],
          },
          metadata: {
            category: 'tutorial',
            difficulty: 'beginner',
          },
          status: 'approved',
        },
        {
          business_profile_id: firstProfile.id,
          created_by: demoUserId,
          title: 'Understanding TypeScript Generics',
          description: 'Deep dive into TypeScript generic types',
          content_type: 'post',
          content_data: {
            body: 'TypeScript generics allow us to create reusable components that work with multiple types. Let\'s explore how to use them effectively...',
            tags: ['typescript', 'programming'],
          },
          metadata: {
            category: 'tutorial',
            difficulty: 'intermediate',
          },
          status: 'pending_approval',
        },
        {
          business_profile_id: firstProfile.id,
          created_by: demoUserId,
          title: 'Video Script: React Hooks Explained',
          description: 'Script for a YouTube video about React Hooks',
          content_type: 'script',
          content_data: {
            intro: 'Welcome to this video about React Hooks!',
            mainContent: 'React Hooks revolutionized how we write React components. Today we\'ll cover useState, useEffect, and custom hooks...',
            outro: 'Thanks for watching! Don\'t forget to like and subscribe.',
            duration: '10:00',
          },
          metadata: {
            category: 'video',
            platform: 'YouTube',
          },
          status: 'draft',
        },
        {
          business_profile_id: firstProfile.id,
          created_by: demoUserId,
          title: 'Social Media Hook: Weekly Tech Roundup',
          description: 'Hook for social media post about weekly tech news',
          content_type: 'hook',
          content_data: {
            hook: 'This week in tech: AI breakthroughs, new frameworks, and developer tools you need to know! 🚀',
            callToAction: 'What tech news caught your attention this week?',
          },
          metadata: {
            category: 'social-media',
            platform: 'Twitter',
          },
          status: 'approved',
        },
      ];

      for (const pack of contentPacks) {
        const { data: existing } = await supabase
          .from('content_packs')
          .select('id')
          .eq('business_profile_id', firstProfile.id)
          .eq('title', pack.title)
          .single();

        if (!existing) {
          const { data: newPack } = await supabase
            .from('content_packs')
            .insert(pack)
            .select()
            .single();

          if (newPack && pack.status !== 'draft') {
            // Create approval workflow
            await supabase
              .from('approval_workflows')
              .insert({
                content_pack_id: newPack.id,
                organization_id: organizationId,
                current_state: pack.status === 'approved' ? 'approved' : 'pending_approval',
                requested_by: demoUserId,
                reviewed_by: pack.status === 'approved' ? demoUserId : null,
                reviewed_at: pack.status === 'approved' ? new Date().toISOString() : null,
              });
          }
        }
      }
    }

    // 6. Create budget ledger
    if (createdProfiles.length > 0) {
      const firstProfile = createdProfiles[0];
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthKey = currentMonth.toISOString().split('T')[0];

      const { data: existingLedger } = await supabase
        .from('budget_ledger')
        .select('id')
        .eq('business_profile_id', firstProfile.id)
        .eq('month', monthKey)
        .single();

      if (!existingLedger) {
        await supabase
          .from('budget_ledger')
          .insert({
            business_profile_id: firstProfile.id,
            organization_id: organizationId,
            month: monthKey,
            monthly_cap: 1000.00,
            actual_spend: 125.50,
            currency: 'USD',
            is_approved: true,
            approved_by: demoUserId,
            approved_at: new Date().toISOString(),
          });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data seeded successfully',
      organizationId,
      profilesCreated: createdProfiles.length,
    });
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}

