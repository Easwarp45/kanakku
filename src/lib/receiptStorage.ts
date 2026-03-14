import { supabase } from '@/integrations/supabase/client';

const RECEIPT_BUCKET = 'receipts';

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uploadReceipt(params: {
  file: File;
  userId: string;
  expenseId?: string;
}): Promise<string> {
  const { file, userId, expenseId } = params;

  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    const extension = sanitizeFileName(file.name).split('.').pop() || 'jpg';
    const fileName = `${expenseId ?? 'receipt'}-${Date.now()}.${extension}`;
    const filePath = `public/${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Provide helpful error messages
      if (uploadError.message?.includes('not found')) {
        throw new Error('Receipts storage bucket not configured. Contact support.');
      }
      if (uploadError.message?.includes('policy')) {
        throw new Error('Receipt upload not authorized. RLS policies need to be configured. Check docs/RLS_POLICY_FIX.md');
      }
      if (uploadError.message?.includes('Unauthorized')) {
        throw new Error('You do not have permission to upload receipts.');
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(RECEIPT_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to generate receipt URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Receipt upload error:', error);
    throw error;
  }
}
