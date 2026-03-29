import { vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import type { AuthContextType } from '@/hooks/useAuth';

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    unsubscribe: vi.fn(),
  };

  return {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  };
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

/**
 * Create a mock auth context for testing
 */
export function createMockAuthContext(
  user: User | null = null
): AuthContextType {
  return {
    user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
  };
}

/**
 * Mock the useAuth hook
 */
export function mockUseAuth(user: User | null = createMockUser()) {
  return vi.fn(() => createMockAuthContext(user));
}
