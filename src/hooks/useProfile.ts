import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  language: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  phone_number?: string;
  currency?: string;
  language?: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: input.display_name,
          phone_number: input.phone_number,
          currency: input.currency,
          language: input.language,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
}
