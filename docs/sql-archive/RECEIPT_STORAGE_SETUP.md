# Supabase Storage Setup - Receipts Bucket

## Steps to Set Up Receipt Upload in Supabase

### 1. Create the Receipts Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `receipts`
5. **Uncheck** "Make it private" (keep it public for easy access)
6. Click **Create Bucket**

### 2. Set Up Row Level Security (RLS) Policies

After creating the bucket, set up the following RLS policies:

#### Policy 1: Allow users to upload their own receipts

```sql
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow users to read their own receipts

```sql
CREATE POLICY "Users can read their own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

OR if you want public read access (simpler):

```sql
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

#### Policy 3: Allow users to delete their own receipts

```sql
CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Alternative: Quick Setup via Dashboard UI

If you prefer using the dashboard UI instead of SQL:

1. Go to **Storage** → **receipts** bucket
2. Click **Policies** tab
3. Click **New Policy** → **For full customization**
4. Set up the policies as shown above

### 4. File Path Structure

Files are uploaded with this path structure:
```
receipts/public/{userId}/{fileName}.{ext}
```

Example:
```
receipts/public/a1b2c3d4-e5f6-7890-abcd-ef1234567890/receipt-1710432000000.jpg
```

### 5. Getting the Public URL

Once uploaded, the public URL will be:
```
https://xtqtmcmheazewnpfftty.supabase.co/storage/v1/object/public/receipts/public/{userId}/{fileName}.ext
```

## Troubleshooting

### 400 Bad Request Error
- Bucket doesn't exist → Create it following steps above
- Path is invalid → Check the path format
- File size too large → Keep under 10MB

### 401 Unauthorized Error
- User not authenticated → Ensure user is logged in
- RLS policies not set → Set up policies from step 2

### 403 Forbidden Error
- RLS policy denies access → Check policy rules match user ID

## Testing the Upload

Once set up:
1. Log in to the app
2. Go to **Add Expense**
3. Select a receipt image (JPG, PNG, PDF)
4. Submit the form
5. The receipt should upload and attach to the expense
