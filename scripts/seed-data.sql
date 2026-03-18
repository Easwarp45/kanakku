/**
 * IMPORTANT: Run this script in your Supabase SQL Editor
 * 
 * Path: Supabase Dashboard > SQL Editor > New Query
 * 
 * This SQL script creates test data for the Kanakku application.
 * It creates test users, expenses, groups, and more.
 * 
 * NOTE: This script uses dummy UUIDs. You should:
 * 1. First get real user IDs by creating auth users
 * 2. Then replace the UUID placeholders with actual user IDs
 * 
 * Or use the TypeScript seed script instead (scripts/seed-data.ts)
 */

-- Create a test group
INSERT INTO groups (id, name, description, created_by, invite_code)
VALUES (
  gen_random_uuid(),
  'Trip to Goa',
  'Sharing expenses for our vacation',
  auth.uid(),
  'TRIP2024'
);

-- Add expenses with various categories
INSERT INTO expenses (user_id, amount, category, description, payment_method, expense_date)
VALUES
  (auth.uid(), 250, 'food', 'Lunch at restaurant', 'cash', NOW()::date),
  (auth.uid(), 500, 'food', 'Groceries from market', 'upi', NOW()::date - INTERVAL '1 day'),
  (auth.uid(), 150, 'transport', 'Uber ride', 'upi', NOW()::date - INTERVAL '2 days'),
  (auth.uid(), 700, 'transport', 'Petrol fill-up', 'card', NOW()::date - INTERVAL '3 days'),
  (auth.uid(), 500, 'entertainment', 'Movie tickets', 'card', NOW()::date - INTERVAL '4 days'),
  (auth.uid(), 199, 'entertainment', 'Gaming subscription', 'upi', NOW()::date - INTERVAL '5 days'),
  (auth.uid(), 2500, 'shopping', 'Clothes shopping', 'card', NOW()::date - INTERVAL '6 days'),
  (auth.uid(), 10000, 'shopping', 'Electronics purchase', 'card', NOW()::date - INTERVAL '7 days'),
  (auth.uid(), 1000, 'bills', 'Electricity bill', 'upi', NOW()::date - INTERVAL '8 days'),
  (auth.uid(), 400, 'bills', 'Internet bill', 'upi', NOW()::date - INTERVAL '9 days'),
  (auth.uid(), 1000, 'health', 'Doctor visit', 'card', NOW()::date - INTERVAL '10 days'),
  (auth.uid(), 400, 'health', 'Medicine pharmacy', 'cash', NOW()::date - INTERVAL '11 days'),
  (auth.uid(), 999, 'education', 'Course subscription', 'upi', NOW()::date - INTERVAL '12 days'),
  (auth.uid(), 600, 'education', 'Books', 'cash', NOW()::date - INTERVAL '13 days'),
  (auth.uid(), 15000, 'travel', 'Flight ticket', 'card', NOW()::date - INTERVAL '14 days'),
  (auth.uid(), 5000, 'travel', 'Hotel booking', 'card', NOW()::date - INTERVAL '15 days'),
  (auth.uid(), 350, 'food', 'Dinner, cafe', 'cash', NOW()::date - INTERVAL '1 day'),
  (auth.uid(), 200, 'transport', 'Bus pass', 'cash', NOW()::date - INTERVAL '2 days'),
  (auth.uid(), 300, 'entertainment', 'Concert tickets', 'card', NOW()::date - INTERVAL '3 days'),
  (auth.uid(), 1500, 'shopping', 'Shoes and accessories', 'card', NOW()::date - INTERVAL '4 days');

-- Add income entries
INSERT INTO income (user_id, amount, category, description, income_date, source)
VALUES
  (auth.uid(), 50000, 'salary', 'Monthly salary', NOW()::date, 'salary'),
  (auth.uid(), 5000, 'freelance', 'Project work - Web development', NOW()::date - INTERVAL '5 days', 'freelance'),
  (auth.uid(), 1000, 'investment', 'Stock dividend received', NOW()::date - INTERVAL '10 days', 'investment'),
  (auth.uid(), 2000, 'freelance', 'Consulting project', NOW()::date - INTERVAL '15 days', 'freelance'),
  (auth.uid(), 3000, 'bonus', 'Performance bonus', NOW()::date - INTERVAL '20 days', 'bonus');

-- Create budgets
INSERT INTO budgets (user_id, category, amount, period)
VALUES
  (auth.uid(), 'food', 5000, 'monthly'),
  (auth.uid(), 'transport', 3000, 'monthly'),
  (auth.uid(), 'entertainment', 2000, 'monthly'),
  (auth.uid(), 'shopping', 10000, 'monthly'),
  (auth.uid(), 'bills', 5000, 'monthly');

-- Create notifications
INSERT INTO notifications (user_id, type, title, message, read, data)
VALUES
  (auth.uid(), 'expense_added', 'Expense Added', 'You added a new expense of ₹250', false, '{}'),
  (auth.uid(), 'budget_alert', 'Budget Alert', 'You''ve used 75% of your food budget', false, '{}'),
  (auth.uid(), 'group_invite', 'Group Invite', 'You were invited to "Trip to Goa"', false, '{}'),
  (auth.uid(), 'settlement_request', 'Settlement', 'You owe ₹500 for shared expenses', false, '{}');
