# Scripts Directory

## Test Data Seeding

### Option 1: Using Supabase SQL Editor (Recommended for Quick Testing)

**File**: `seed-data.sql`

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy-paste the contents of `seed-data.sql`
5. Click **Run** to execute

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

### SQL script fails with "permission denied"
- Ensure you're logged into Supabase with the correct account
- Check that RLS policies are properly configured

### TypeScript script fails with missing env
- Copy `.env.local.example` to `.env.local`
- Add your Supabase credentials

### No data appears in app after seeding
- Clear browser cache and refresh
- Check Network tab in DevTools for API errors
- Verify RLS policies allow read access to your data
