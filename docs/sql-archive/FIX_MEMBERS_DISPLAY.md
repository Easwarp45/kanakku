# Fix Group Members Display and Admin Controls

## Problem Summary
- ❌ Joined members not showing in the members list
- ❌ Admin cannot remove/kick members from the group
- ❌ RLS policies blocking member visibility

## Solution

### Step 1: Apply Database SQL Fix
1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy ALL SQL from [GROUP_MEMBERS_RLS_FIX.sql](GROUP_MEMBERS_RIX.sql)
3. Click **Run** ✅
4. Wait 10 seconds for the schema to sync

### Step 2: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Clear Cache & Test
1. Open DevTools (F12)
2. Go to **Application** → **Cache Storage** 
3. Delete all cache entries
4. Hard refresh page (Ctrl+Shift+R)

### Step 4: Test the Fix

**Test Case 1: Members Display**
1. Create a new group (Group A)
2. Copy the invite code
3. Sign out or use Incognito
4. Sign in with a different account (User B)
5. Join Group A using the invite code
6. Go to Group A members tab
7. ✅ You should see User B listed as a member

**Test Case 2: Admin Controls**
1. As the group creator (User A), go to Group A
2. Look for the remove button (X icon) next to User B
3. Click the X button
4. Confirm removal
5. ✅ User B should be removed from the members list

**Test Case 3: Admin Badge**
1. Create Group A as User A
2. User A should see "Admin" badge next to their name
3. Other members should NOT see an Admin badge
4. ✅ Only group creator has Admin badge

## What Was Fixed

### Database Changes (GROUP_MEMBERS_RLS_FIX.sql)
✅ Fixed RLS SELECT policy - members can now view all group members
✅ Fixed RLS DELETE policy - admins can remove members, users can leave
✅ Ensured is_admin and created_at columns exist
✅ Added proper indexes for performance

### Frontend Changes (useGroups.ts)
✅ Updated useGroupMembers to select is_admin column
✅ Changed ordering to show members by join date
✅ Reduced staleTime to 5 minutes for faster updates

## File Changes
- `GROUP_MEMBERS_RLS_FIX.sql` - Database RLS policies and schema
- `src/hooks/useGroups.ts` - Updated member query

## Troubleshooting

**If members still don't show:**
- Clear browser cache (DevTools → Cache Storage)
- Check browser console for errors (F12)
- Hard refresh page (Ctrl+Shift+R)
- Wait 30 seconds and refresh

**If admin can't remove members:**
- Verify you're the group creator (should see "Admin" badge)
- Check that Supabase SQL executed without errors
- Look in browser console for error messages

**If you see "Only group admins can remove members":**
- You need to be the group creator
- Only group creators have is_admin = true
- Regular members cannot remove other members
