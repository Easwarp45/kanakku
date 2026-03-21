# Groups "Unknown User" Fix + UI Improvements

## Root Cause

The `profiles` table has a Supabase RLS policy that only lets a user view **their own** profile row:
```sql
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);
```
When `useGroupMembers` fetches profiles of all members in a group, the query returns only the current user's profile and silently blocks the others. So `member.profile?.display_name` is `null` for all other members, causing the UI to fall back to `'Unknown'`.

## Proposed Changes

---

### Database (Supabase Migration)

#### [NEW] fix_profiles_group_visibility.sql
Create a new migration that adds an additional RLS policy to `profiles`, allowing group members to view each other's profiles:

```sql
-- Allow users to view profiles of people who share a group with them
CREATE POLICY "Group members can view each other's profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id  -- own profile (existing)
  OR EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
    AND gm2.user_id = profiles.user_id
  )
);
```

> [!IMPORTANT]
> The existing policy names `"Users can view their own profile"` must be dropped first and recreated as a combined policy, OR we can just add the new policy alongside it (Supabase uses OR logic between multiple SELECT policies for the same role).

The safest approach: **add a second SELECT policy** alongside the existing one. With RLS, multiple SELECT policies for the same role are evaluated with OR — so you just need to pass at least one.

---

### `useGroups.ts` Hook

#### [MODIFY] useGroups.ts

In `useGroupMembers`, after fetching profiles, add a **fallback to `auth.email`** for the current user by also fetching the auth metadata, providing a better display name than `"User abc123"`.

Also update the `display_name` fallback chain:
```
nickname → profile.display_name → email (extracted from auth RPC) → "User {id.slice(0,6)}"
```

Since we can't get other users' emails (auth.users is private), after the RLS fix the profile display_name should already work. No hook code changes needed if the migration is applied.

However, add a **robustness fix**: ensure the fallback shows the user's email initial rather than a UUID substring for *themselves*.

---

### `GroupDetail.tsx`

#### [MODIFY] GroupDetail.tsx

1. **Members Tab** — improve UI:
   - Add colored background to avatar based on name hash (not just grey)
   - Show email badge if no display name is set
   - Cleaner member card with better spacing

2. **Expenses Tab** — `payerName` already falls back to `'Unknown'` — this resolves once RLS is fixed.

3. **Balances Tab** — `balance.display_name` falls back to `'Unknown'` — resolves with RLS fix.

4. **Chat Tab** — add a missing chat tab to the Tabs navigation (currently `group_chats` data is fetched but the tab isn't rendered in the UI).

---

### `Groups.tsx`

#### [MODIFY] Groups.tsx

1. **GroupCard** — add colored avatar circles with name initials (not just user count)
2. Improve the card layout: show group description if available
3. Better empty state with clearer CTA

---

## Verification Plan

### Manual Verification (in browser)

1. **Start the dev server** — already running at `http://localhost:5173` (or the port shown in `npm run dev`)

2. **Test member name display:**
   - Go to **Groups** page → open a group → click **Members tab**
   - Members should now show real names instead of "Unknown User"
   - The payer name in **Expenses tab** should be real names
   - **Balances tab** should show real names

3. **Test with two accounts:**
   - Log in as User A, create a group, copy invite code
   - Log in as User B, join the group with the invite code
   - Both users should see each other's names in the group

4. **UI check:**
   - Verify avatar colors are distinct per member
   - Verify the invite code card looks clean
   - Verify group cards on the Groups list show descriptions

> [!NOTE]
> There are no automated unit/integration tests in the project (only node_modules tests). Verification is done manually in the browser.
