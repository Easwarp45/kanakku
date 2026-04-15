import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import { registerAuthFailure } from '@/lib/authRateLimit';

const { mockSignInWithPassword, mockGetSession, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithPassword: mockSignInWithPassword,
    },
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth signIn lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
      callback('INITIAL_SESSION', null);
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it('blocks sign-in after repeated failed attempts', async () => {
    const email = 'lock@example.com';
    for (let i = 0; i < 5; i += 1) {
      registerAuthFailure(email);
    }

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const response = await result.current.signIn(email, 'wrong-password');

    expect(response.error?.message).toContain('Too many failed login attempts');
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});
