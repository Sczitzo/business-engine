/**
 * Seed demo data for testing the Business Engine
 * This script creates sample organizations, business profiles, and content packs
 */

import { getSupabaseServiceClient } from '@/lib/supabase/server';

async function seedDemoData() {
  console.log('🌱 Starting demo data seed...');
  
  const supabase = getSupabaseServiceClient();
  
  try {
    // 1. Create a demo organization
    console.log('Creating demo organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Demo Company',
        slug: 'demo-company',
      })
      .select()
      .single();

    if (orgError && !orgError.message.includes('duplicate')) {
      throw orgError;
    }

    // Get or create organization
    let organizationId: string;
    if (org) {
      organizationId = org.id;
      console.log('✅ Using existing organization:', organizationId);
    } else {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'demo-company')
        .single();
      
      if (!existingOrg) {
        throw new Error('Failed to create or find organization');
      }
      organizationId = existingOrg.id;
      console.log('✅ Found existing organization:', organizationId);
    }

    // 2. Create a demo user (using a fixed UUID for demo purposes)
    // In production, this would come from Supabase Auth
    const demoUserId = '00000000-0000-0000-0000-000000000001';
    
    console.log('Creating demo user...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: demoUserId,
        email: 'demo@businessengine.com',
        full_name: 'Demo User',
      }, {
        onConflict: 'id',
      });

    if (userError && !userError.message.includes('duplicate')) {
      console.warn('User creation warning:', userError.message);
    } else {
      console.log('✅ Demo user ready');
    }

    // 3. Add user to organization
    console.log('Adding user to organization...');
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        organization_id: organizationId,
        user_id: demoUserId,
        role: 'owner',
      }, {
        onConflict: 'organization_id,user_id',
      });

    if (memberError && !memberError.message.includes('duplicate')) {
      console.warn('Member creation warning:', memberError.message);
    } else {
      console.log('✅ User added to organization');
    }

    // 4. Create business profiles
    console.log('Creating business profiles...');
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
        console.log(`✅ Business profile "${profile.name}" already exists`);
      } else {
        const { data: newProfile, error: profileError } = await supabase
          .from('business_profiles')
          .insert(profile)
          .select()
          .single();

        if (profileError) {
          console.error(`❌ Error creating profile "${profile.name}":`, profileError);
        } else {
          createdProfiles.push(newProfile);
          console.log(`✅ Created business profile: "${profile.name}"`);
        }
      }
    }

    if (createdProfiles.length === 0) {
      // Get existing profiles
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
      console.log(`Creating content packs for "${firstProfile.name || 'first profile'}"...`);

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

        if (existing) {
          console.log(`✅ Content pack "${pack.title}" already exists`);
        } else {
          const { data: newPack, error: packError } = await supabase
            .from('content_packs')
            .insert(pack)
            .select()
            .single();

          if (packError) {
            console.error(`❌ Error creating pack "${pack.title}":`, packError);
          } else {
            console.log(`✅ Created content pack: "${pack.title}"`);

            // Create approval workflow for non-draft packs
            if (pack.status !== 'draft') {
              const { error: workflowError } = await supabase
                .from('approval_workflows')
                .insert({
                  content_pack_id: newPack.id,
                  organization_id: organizationId,
                  current_state: pack.status === 'approved' ? 'approved' : 'pending_approval',
                  requested_by: demoUserId,
                  reviewed_by: pack.status === 'approved' ? demoUserId : null,
                  reviewed_at: pack.status === 'approved' ? new Date().toISOString() : null,
                });

              if (workflowError) {
                console.warn(`⚠️  Could not create workflow for "${pack.title}":`, workflowError.message);
              }
            }
          }
        }
      }
    }

    // 6. Create budget ledger for the first profile
    if (createdProfiles.length > 0) {
      const firstProfile = createdProfiles[0];
      console.log('Creating budget ledger...');

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
        const { error: budgetError } = await supabase
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

        if (budgetError) {
          console.warn('⚠️  Could not create budget ledger:', budgetError.message);
        } else {
          console.log('✅ Created budget ledger');
        }
      } else {
        console.log('✅ Budget ledger already exists');
      }
    }

    console.log('\n🎉 Demo data seeding complete!');
    console.log('\nYou can now:');
    console.log('1. Visit the dashboard');
    console.log('2. Select a business profile');
    console.log('3. View and manage content packs');
    console.log('4. Test approval workflows');
    console.log('5. Check budget management');
    
  } catch (error: any) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

export default seedDemoData;

