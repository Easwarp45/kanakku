# Scripts Directory

## Test Data Seeding

### Option 1: Using Supabase SQL Editor (Recommended for Quick Testing)

**File**: `seed-data.sql`

### Steps:

1. Go to your [Supabase Dashboard](https://app.supabase.com/) and select your project

2. **Get your User ID** (first, in a new query):
   - Go to **SQL Editor** → **New Query**
   - Run this command:
     ```sql
     SELECT auth.uid();
     ```
   - Copy the UUID result (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

3. **Prepare the seed script**:
   - Open `seed-data.sql` from this directory
   - Replace all instances of `'YOUR_USER_ID_HERE'` with your copied UUID
   - There are **7 places** to replace (use Find & Replace: Ctrl+H)

4. **Execute the script**:
   - Go to **SQL Editor** → **New Query** (or create fresh query)
   - Copy-paste the entire modified `seed-data.sql` script
   - Click **Run** to execute

**What it creates**:
- 16+ sample expenses across all categories (food, transport, entertainment, shopping, bills, health, education, travel)
- 5 sample income entries (salary, freelance, investment, bonus)
- 5 budgets for main spending categories
- 4 notifications
- 1 sample group "Trip to Goa"

---

### Option 2: Using TypeScript Script (For Production/Development)

**File**: `seed-data.ts`

```bash
# Make sure you have dependencies installed
npm install

# Run the seed script
npx ts-node scripts/seed-data.ts
```

**Requires**:
- Supabase credentials in `.env.local`:
  ```
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_key
  ```

---

## Test User Credentials

After seeding, use these credentials to test the app:

```
Email: user1@test.local
Password: Test@123!

Email: user2@test.local
Password: Test@123!

Email: user3@test.local
Password: Test@123!

Email: user4@test.local
Password: Test@123!
```

---

## Test Data Structure

### Categories Available
- **Expenses**: food, transport, entertainment, shopping, bills, health, education, travel, other
- **Income**: salary, freelance, investment, bonus, gifts, other

### Sample Expenses
- ₹250 - Lunch at restaurant (food)
- ₹500 - Groceries (food)
- ₹700 - Petrol fill-up (transport)
- ₹500 - Movie tickets (entertainment)
- ₹2500 - Clothes shopping (shopping)
- ₹15000 - Flight ticket (travel)
- ... and 10+ more

### Sample Income
- ₹50,000 - Monthly salary
- ₹5,000 - Project work
- ₹1,000 - Stock dividend
- ₹3,000 - Performance bonus

### Sample Group
- **Name**: Trip to Goa
- **Members**: 3 members
- **Purpose**: Testing shared expenses and group settlements

---

## Notes

1. **First Time Setup**: You'll need to create auth users first through Supabase or use email magic links
2. **Idempotent**: The TypeScript script safely handles existing users
3. **Date Range**: All test expenses are within the last 15 days for easy filtering
4. **Real Data**: All amounts are realistic for Indian expenses (INR)

---

## Troubleshooting

### SQL script fails with "null value in column 'created_by'"
**Cause**: You forgot to replace `YOUR_USER_ID_HERE` with your actual user ID
**Solution**: 
1. Find your UUID by running `SELECT auth.uid();` in a new SQL query
2. Use Find & Replace (Ctrl+H) to replace all `'YOUR_USER_ID_HERE'` with your UUID
3. Example: `'YOUR_USER_ID_HERE'::uuid` → `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid`

### SQL script fails with "permission denied"
- Ensure you're logged into Supabase with the correct account
- Check that RLS policies allow you to insert data

### TypeScript script fails with missing env
- Copy `.env.local.example` to `.env.local`
- Add your Supabase credentials

### No data appears in app after seeding
- Clear browser cache and refresh
- Check Network tab in DevTools for API errors
- Verify RLS policies allow read access to your data
