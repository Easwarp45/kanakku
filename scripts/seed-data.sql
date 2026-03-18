/* 
 * IMPORTANT: Run this script in your Supabase SQL Editor
 * 
 * Path: Supabase Dashboard > SQL Editor > New Query
 * 
 * HOW TO USE:
 * 1. Before running, get your User ID:
 *    - Go back to SQL Editor > New Query
 *    - Run: SELECT auth.uid();
 *    - Copy the returned UUID
 * 
 * 2. Replace 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' with your actual UUID below (3 places)
 * 
 * 3. Run this entire script
 * 
 * Or use the TypeScript seed script instead: npx ts-node scripts/seed-data.ts
 */

-- REPLACE THIS WITH YOUR ACTUAL USER ID
-- Get it by running: SELECT auth.uid();
-- It should look like: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- Create a test group
INSERT INTO groups (id, name, description, created_by, invite_code)
VALUES (
  gen_random_uuid(),
  'Trip to Goa',
  'Sharing expenses for our vacation',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'TRIP2024'
);

-- Add expenses with various categories
INSERT INTO expenses (user_id, amount, category, description, payment_method, expense_date)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 250, 'food', 'Lunch at restaurant', 'cash', NOW()::date),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 500, 'food', 'Groceries from market', 'upi', NOW()::date - INTERVAL '1 day'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 150, 'transport', 'Uber ride', 'upi', NOW()::date - INTERVAL '2 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 700, 'transport', 'Petrol fill-up', 'card', NOW()::date - INTERVAL '3 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 500, 'entertainment', 'Movie tickets', 'card', NOW()::date - INTERVAL '4 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 199, 'entertainment', 'Gaming subscription', 'upi', NOW()::date - INTERVAL '5 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 2500, 'shopping', 'Clothes shopping', 'card', NOW()::date - INTERVAL '6 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 10000, 'shopping', 'Electronics purchase', 'card', NOW()::date - INTERVAL '7 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 1000, 'bills', 'Electricity bill', 'upi', NOW()::date - INTERVAL '8 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 400, 'bills', 'Internet bill', 'upi', NOW()::date - INTERVAL '9 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 1000, 'health', 'Doctor visit', 'card', NOW()::date - INTERVAL '10 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 400, 'health', 'Medicine pharmacy', 'cash', NOW()::date - INTERVAL '11 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 999, 'education', 'Course subscription', 'upi', NOW()::date - INTERVAL '12 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 600, 'education', 'Books', 'cash', NOW()::date - INTERVAL '13 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 15000, 'travel', 'Flight ticket', 'card', NOW()::date - INTERVAL '14 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 5000, 'travel', 'Hotel booking', 'card', NOW()::date - INTERVAL '15 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 350, 'food', 'Dinner, cafe', 'cash', NOW()::date - INTERVAL '1 day'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 200, 'transport', 'Bus pass', 'cash', NOW()::date - INTERVAL '2 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 300, 'entertainment', 'Concert tickets', 'card', NOW()::date - INTERVAL '3 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 1500, 'shopping', 'Shoes and accessories', 'card', NOW()::date - INTERVAL '4 days');

-- Add income entries
INSERT INTO income (user_id, amount, source, description, income_date)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 50000, 'salary', 'Monthly salary', NOW()::date),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 5000, 'freelance', 'Project work - Web development', NOW()::date - INTERVAL '5 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 1000, 'investment', 'Stock dividend received', NOW()::date - INTERVAL '10 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 2000, 'freelance', 'Consulting project', NOW()::date - INTERVAL '15 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 3000, 'business', 'Side project earnings', NOW()::date - INTERVAL '20 days');

-- Create budgets
INSERT INTO budgets (user_id, category, amount, period)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'food', 5000, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'transport', 3000, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'entertainment', 2000, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'shopping', 10000, 'monthly'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'bills', 5000, 'monthly');

-- Create notifications
INSERT INTO notifications (user_id, type, title, message, read, data)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'expense_added', 'Expense Added', 'You added a new expense of ₹250', false, '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'budget_alert', 'Budget Alert', 'You''ve used 75% of your food budget', false, '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'group_invite', 'Group Invite', 'You were invited to "Trip to Goa"', false, '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'settlement_request', 'Settlement', 'You owe ₹500 for shared expenses', false, '{}');
