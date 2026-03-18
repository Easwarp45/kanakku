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
 * 2. Replace 'YOUR_USER_ID_HERE' with your actual UUID below (3 places)
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
  'YOUR_USER_ID_HERE'::uuid,
  'TRIP2024'
);

-- Add expenses with various categories
INSERT INTO expenses (user_id, amount, category, description, payment_method, expense_date)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 250, 'food', 'Lunch at restaurant', 'cash', NOW()::date),
  ('YOUR_USER_ID_HERE'::uuid, 500, 'food', 'Groceries from market', 'upi', NOW()::date - INTERVAL '1 day'),
  ('YOUR_USER_ID_HERE'::uuid, 150, 'transport', 'Uber ride', 'upi', NOW()::date - INTERVAL '2 days'),
  ('YOUR_USER_ID_HERE'::uuid, 700, 'transport', 'Petrol fill-up', 'card', NOW()::date - INTERVAL '3 days'),
  ('YOUR_USER_ID_HERE'::uuid, 500, 'entertainment', 'Movie tickets', 'card', NOW()::date - INTERVAL '4 days'),
  ('YOUR_USER_ID_HERE'::uuid, 199, 'entertainment', 'Gaming subscription', 'upi', NOW()::date - INTERVAL '5 days'),
  ('YOUR_USER_ID_HERE'::uuid, 2500, 'shopping', 'Clothes shopping', 'card', NOW()::date - INTERVAL '6 days'),
  ('YOUR_USER_ID_HERE'::uuid, 10000, 'shopping', 'Electronics purchase', 'card', NOW()::date - INTERVAL '7 days'),
  ('YOUR_USER_ID_HERE'::uuid, 1000, 'bills', 'Electricity bill', 'upi', NOW()::date - INTERVAL '8 days'),
  ('YOUR_USER_ID_HERE'::uuid, 400, 'bills', 'Internet bill', 'upi', NOW()::date - INTERVAL '9 days'),
  ('YOUR_USER_ID_HERE'::uuid, 1000, 'health', 'Doctor visit', 'card', NOW()::date - INTERVAL '10 days'),
  ('YOUR_USER_ID_HERE'::uuid, 400, 'health', 'Medicine pharmacy', 'cash', NOW()::date - INTERVAL '11 days'),
  ('YOUR_USER_ID_HERE'::uuid, 999, 'education', 'Course subscription', 'upi', NOW()::date - INTERVAL '12 days'),
  ('YOUR_USER_ID_HERE'::uuid, 600, 'education', 'Books', 'cash', NOW()::date - INTERVAL '13 days'),
  ('YOUR_USER_ID_HERE'::uuid, 15000, 'travel', 'Flight ticket', 'card', NOW()::date - INTERVAL '14 days'),
  ('YOUR_USER_ID_HERE'::uuid, 5000, 'travel', 'Hotel booking', 'card', NOW()::date - INTERVAL '15 days'),
  ('YOUR_USER_ID_HERE'::uuid, 350, 'food', 'Dinner, cafe', 'cash', NOW()::date - INTERVAL '1 day'),
  ('YOUR_USER_ID_HERE'::uuid, 200, 'transport', 'Bus pass', 'cash', NOW()::date - INTERVAL '2 days'),
  ('YOUR_USER_ID_HERE'::uuid, 300, 'entertainment', 'Concert tickets', 'card', NOW()::date - INTERVAL '3 days'),
  ('YOUR_USER_ID_HERE'::uuid, 1500, 'shopping', 'Shoes and accessories', 'card', NOW()::date - INTERVAL '4 days');

-- Add income entries
INSERT INTO income (user_id, amount, category, description, income_date, source)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 50000, 'salary', 'Monthly salary', NOW()::date, 'salary'),
  ('YOUR_USER_ID_HERE'::uuid, 5000, 'freelance', 'Project work - Web development', NOW()::date - INTERVAL '5 days', 'freelance'),
  ('YOUR_USER_ID_HERE'::uuid, 1000, 'investment', 'Stock dividend received', NOW()::date - INTERVAL '10 days', 'investment'),
  ('YOUR_USER_ID_HERE'::uuid, 2000, 'freelance', 'Consulting project', NOW()::date - INTERVAL '15 days', 'freelance'),
  ('YOUR_USER_ID_HERE'::uuid, 3000, 'bonus', 'Performance bonus', NOW()::date - INTERVAL '20 days', 'bonus');

-- Create budgets
INSERT INTO budgets (user_id, category, amount, period)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 'food', 5000, 'monthly'),
  ('YOUR_USER_ID_HERE'::uuid, 'transport', 3000, 'monthly'),
  ('YOUR_USER_ID_HERE'::uuid, 'entertainment', 2000, 'monthly'),
  ('YOUR_USER_ID_HERE'::uuid, 'shopping', 10000, 'monthly'),
  ('YOUR_USER_ID_HERE'::uuid, 'bills', 5000, 'monthly');

-- Create notifications
INSERT INTO notifications (user_id, type, title, message, read, data)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 'expense_added', 'Expense Added', 'You added a new expense of ₹250', false, '{}'),
  ('YOUR_USER_ID_HERE'::uuid, 'budget_alert', 'Budget Alert', 'You''ve used 75% of your food budget', false, '{}'),
  ('YOUR_USER_ID_HERE'::uuid, 'group_invite', 'Group Invite', 'You were invited to "Trip to Goa"', false, '{}'),
  ('YOUR_USER_ID_HERE'::uuid, 'settlement_request', 'Settlement', 'You owe ₹500 for shared expenses', false, '{}');
