import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@/test/test-utils';
import { createMockUser } from '@/test/mocks';

const { mockFromFn } = vi.hoisted(() => ({
  mockFromFn: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFromFn,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { useBudgets, useCreateBudget } from './useBudgets';

function createThenableBuilder(payload: unknown) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(payload)),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(payload).then(onFulfilled, onRejected),
  };

  return builder;
}

describe('useBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user budgets', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: createMockUser(),
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      session: null,
    });

    const builder = createThenableBuilder({
      data: [{ id: 'b1', user_id: 'u1', category: 'food', amount: 4000, period: 'monthly', created_at: '', updated_at: '' }],
      error: null,
    });
    mockFromFn.mockReturnValue(builder);

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].amount).toBe(4000);
  });

  it('throws for create budget when unauthenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      session: null,
    });

    const { result } = renderHook(() => useCreateBudget());

    await expect(
      act(async () => {
        await result.current.mutateAsync({ category: 'food', amount: 1000 });
      })
    ).rejects.toThrow('User not authenticated');
  });
});
