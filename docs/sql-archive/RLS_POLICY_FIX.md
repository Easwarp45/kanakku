# RLS Policy Fix for Receipt Uploads

## Problem
The current RLS policy is blocking receipt uploads with error:
```
"new row violates row-level security policy"
```

## Solution

Go to your **Supabase Dashboard** and follow these steps:

### Step 1: Remove Old Policies
1. Go to **Storage** → **receipts** bucket
2. Click **Policies** tab
3. Delete any existing policies (click the trash icon)

### Step 2: Add the Correct Policies

Copy and paste these policies in **SQL Editor**:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow users to upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
);
```

#### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

#### Policy 3: Allow Users to Delete Their Own
```sql
CREATE POLICY "Allow users to delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (regexp_split_to_array(name, '/'))[2]
);
```

### How to Apply:
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy ONE policy at a time and paste it
4. Click **Run**
5. Repeat for all 3 policies

### Alternative: Use Dashboard UI
If SQL is not working, use the dashboard directly:

1. Go to **Storage** → **receipts** bucket
2. Click **Policies** → **New Policy** → **For full customization**
3. Use these settings:

**Policy 1: Insert**
- Operation: INSERT
- Target roles: authenticated
- USING condition: Leave empty (allows all authenticated)
- WITH CHECK: Leave empty (allows all authenticated)

**Policy 2: Select**
- Operation: SELECT
- Target roles: public
- USING condition: Leave empty (public read)

**Policy 3: Delete**
- Operation: DELETE
- Target roles: authenticated
- USING condition: `(bucket_id = 'receipts' AND auth.uid()::text = (regexp_split_to_array(name, '/'))[2])`

## Verify It Works
After setting policies, try uploading a receipt again. You should see "Receipt uploaded successfully!" message.

If still getting errors, check:
1. ✅ Bucket "receipts" exists (not "receipt" or other name)
2. ✅ Policies are in the "receipts" bucket (not elsewhere)
3. ✅ You're logged in to the app before uploading
4. ✅ File is under 10MB in size
