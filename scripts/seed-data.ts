/**
 * Seed Script for Kanakku Test Data
 * Run with: npx ts-node scripts/seed-data.ts
 * 
 * This script creates:
 * - Test users with profiles
 * - Test expenses with various categories
 * - Test groups with members and shared expenses
 * - Test income entries
 * - Test budgets
 * - Test notifications
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test user data
const testUsers = [
  {
    email: 'test1@kanakku.app',
    password: 'Test123456!',
    name: 'Easwar Murthy P',
  },
  {
    email: 'test2@kanakku.app',
    password: 'Test123456!',
    name: 'Rahul Kumar',
  },
  {
    email: 'test3@kanakku.app',
    password: 'Test123456!',
    name: 'Priya Singh',
  },
  {
    email: 'test4@kanakku.app',
    password: 'Test123456!',
    name: 'Amit Patel',
  },
];

// Sample expenses for testing
const expenseTemplates = [
  { category: 'food', description: 'Lunch at restaurant', amounts: [250, 350, 450] },
  { category: 'food', description: 'Groceries from market', amounts: [500, 800, 1200] },
  { category: 'transport', description: 'Uber ride', amounts: [80, 150, 200] },
  { category: 'transport', description: 'Petrol fill-up', amounts: [500, 700, 1000] },
  { category: 'entertainment', description: 'Movie tickets', amounts: [300, 500, 600] },
  { category: 'entertainment', description: 'Gaming subscription', amounts: [99, 199, 499] },
  { category: 'shopping', description: 'Clothes shopping', amounts: [1500, 2500, 4000] },
  { category: 'shopping', description: 'Electronics purchase', amounts: [5000, 10000, 25000] },
  { category: 'bills', description: 'Electricity bill', amounts: [500, 1000, 1500] },
  { category: 'bills', description: 'Internet bill', amounts: [200, 400, 600] },
  { category: 'health', description: 'Doctor visit', amounts: [500, 1000, 2000] },
  { category: 'health', description: 'Medicine pharmacy', amounts: [200, 400, 800] },
  { category: 'education', description: 'Course subscription', amounts: [499, 999, 1999] },
  { category: 'education', description: 'Books', amounts: [300, 600, 1200] },
  { category: 'travel', description: 'Flight ticket', amounts: [5000, 15000, 35000] },
  { category: 'travel', description: 'Hotel booking', amounts: [2000, 5000, 15000] },
];

// Sample income sources
const incomeTemplates = [
  { source: 'salary', description: 'Monthly salary', amount: 50000 },
  { source: 'freelance', description: 'Project work', amount: 5000 },
  { source: 'investment', description: 'Dividend received', amount: 1000 },
  { source: 'business', description: 'Side project earnings', amount: 10000 },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Step 1: Create test users
    console.log('📝 Creating test users...');
    const userIds: string[] = [];

    for (const user of testUsers) {
      try {
        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              display_name: user.name,
            },
          },
        });

        if (authError) {
          // User might already exist, try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password,
          });

          if (signInError) {
            console.warn(`⚠️ Failed to create/sign in user ${user.email}: ${signInError.message}`);
            continue;
          }

          if (signInData?.user?.id) {
            userIds.push(signInData.user.id);
            console.log(`✓ Using existing user: ${user.email}`);
          }
        } else if (authData?.user?.id) {
          userIds.push(authData.user.id);
          console.log(`✓ Created user: ${user.email}`);
        }
      } catch (error) {
        console.error(`✗ Error with user ${user.email}:`, error);
      }
    }

    if (userIds.length === 0) {
      console.error('❌ No users created. Stopping seed.');
      return;
    }

    console.log(`✓ Total users ready: ${userIds.length}\n`);

    // Step 2: Ensure profiles exist
    console.log('📋 Ensuring user profiles exist...');
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const user = testUsers[i];

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: user.name,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn(`⚠️ Profile issue for ${userId}: ${error.message}`);
      } else {
        console.log(`✓ Profile ready for: ${user.name}`);
      }
    }
    console.log();

    // Step 3: Create test expenses
    if (userIds.length > 0) {
      console.log('💰 Creating test expenses...');
      const userId = userIds[0];
      let expenseCount = 0;

      for (const template of expenseTemplates) {
        for (let i = 0; i < 2; i++) {
          const amount = template.amounts[Math.floor(Math.random() * template.amounts.length)];
          const daysAgo = Math.floor(Math.random() * 30);
          const expenseDate = new Date();
          expenseDate.setDate(expenseDate.getDate() - daysAgo);

          const { error } = await supabase
            .from('expenses')
            .insert({
              user_id: userId,
              amount,
              category: template.category,
              description: template.description,
              payment_method: ['cash', 'upi', 'card'][Math.floor(Math.random() * 3)],
              expense_date: expenseDate.toISOString().split('T')[0],
              receipt_url: null,
            });

          if (!error) {
            expenseCount++;
          }
        }
      }
      console.log(`✓ Created ${expenseCount} expenses\n`);
    }

    // Step 4: Create test budgets
    if (userIds.length > 0) {
      console.log('🎯 Creating test budgets...');
      const userId = userIds[0];
      const budgetCategories = ['food', 'transport', 'entertainment', 'shopping', 'bills'];
      let budgetCount = 0;

      for (const category of budgetCategories) {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: userId,
            category,
            amount: [5000, 3000, 10000, 20000, 5000][budgetCategories.indexOf(category)],
            period: 'monthly',
          });

        if (!error) {
          budgetCount++;
        }
      }
      console.log(`✓ Created ${budgetCount} budgets\n`);
    }

    // Step 5: Create test income
    if (userIds.length > 0) {
      console.log('💵 Creating test income entries...');
      const userId = userIds[0];
      let incomeCount = 0;

      for (const template of incomeTemplates) {
        const incomeDate = new Date();
        incomeDate.setDate(incomeDate.getDate() - (template.source === 'salary' ? 0 : Math.floor(Math.random() * 30)));

        const { error } = await supabase
          .from('income')
          .insert({
            user_id: userId,
            amount: template.amount,
            source: template.source,
            description: template.description,
            income_date: incomeDate.toISOString().split('T')[0],
          });

        if (!error) {
          incomeCount++;
        }
      }
      console.log(`✓ Created ${incomeCount} income entries\n`);
    }

    // Step 6: Create test group
    if (userIds.length >= 2) {
      console.log('👥 Creating test group...');
      const creatorId = userIds[0];

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase().slice(0, 8);

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: 'Trip to Goa',
          description: 'Sharing expenses for our vacation',
          created_by: creatorId,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (!groupError && groupData) {
        console.log(`✓ Created group: ${groupData.name}`);
        console.log(`  Invite code: ${inviteCode}`);

        // Add group members
        let memberCount = 0;
        for (let i = 0; i < Math.min(3, userIds.length); i++) {
          const { error: memberError } = await supabase
            .from('group_members')
            .upsert({
              group_id: groupData.id,
              user_id: userIds[i],
              is_admin: i === 0,
              nickname: testUsers[i].name.split(' ')[0],
            });

          if (!memberError) {
            memberCount++;
          }
        }
        console.log(`✓ Added ${memberCount} members to group\n`);

        // Add group expenses
        let groupExpenseCount = 0;
        const groupExpenses = [
          { paid_by: userIds[0], amount: 3000, description: 'Hotel 1 night', category: 'travel' },
          { paid_by: userIds[1], amount: 1500, description: 'Dinner night 1', category: 'food' },
          { paid_by: userIds[0], amount: 2000, description: 'Activities & guide', category: 'entertainment' },
          { paid_by: userIds[2], amount: 1000, description: 'Breakfast', category: 'food' },
        ];

        for (const expense of groupExpenses) {
          const { error: expError } = await supabase
            .from('group_expenses')
            .insert({
              group_id: groupData.id,
              paid_by: expense.paid_by,
              amount: expense.amount,
              description: expense.description,
              category: expense.category,
              expense_date: new Date().toISOString().split('T')[0],
              split_type: 'equal',
            });

          if (!expError) {
            groupExpenseCount++;
          }
        }
        console.log(`✓ Created ${groupExpenseCount} group expenses\n`);
      }
    }

    // Step 7: Create notifications
    if (userIds.length > 0) {
      console.log('🔔 Creating test notifications...');
      const userId = userIds[0];
      let notificationCount = 0;

      const notifications = [
        { type: 'expense_added', title: 'Expense Added', message: 'You added a new expense of ₹250' },
        { type: 'budget_alert', title: 'Budget Alert', message: 'You\'ve used 75% of your food budget' },
        { type: 'group_invite', title: 'Group Invite', message: 'You were invited to "Trip to Goa"' },
        { type: 'settlement_request', title: 'Settlement', message: 'You owe Rahul ₹500 for travel expenses' },
      ];

      for (const notif of notifications) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            read: false,
            data: {},
          });

        if (!error) {
          notificationCount++;
        }
      }
      console.log(`✓ Created ${notificationCount} notifications\n`);
    }

    console.log('✅ Database seed completed successfully!\n');
    console.log('📧 Test Users:');
    testUsers.forEach((user) => {
      console.log(`  • ${user.email} / Password: ${user.password}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();
