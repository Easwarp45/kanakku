import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
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
import { useIncome } from './useIncome';

function createThenableBuilder(payload: unknown) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(payload).then(onFulfilled, onRejected),
  };

  return builder;
}

describe('useIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: createMockUser(),
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      session: null,
    });
  });

  it('maps amount to number and applies source filter', async () => {
    const builder = createThenableBuilder({
      data: [
        {
          id: 'inc-1',
          amount: '25000.00',
          source: 'salary',
          description: 'Monthly salary',
          income_date: '2026-04-01',
          is_recurring: true,
          updated_at: '2026-04-01T10:00:00Z',
        },
      ],
      error: null,
    });

    mockFromFn.mockReturnValue(builder);

    const { result } = renderHook(() => useIncome({ source: 'salary' }));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].amount).toBe(25000);
    expect(builder.eq).toHaveBeenCalledWith('source', 'salary');
  });

  it('returns empty array when no user income exists', async () => {
    const builder = createThenableBuilder({ data: [], error: null });
    mockFromFn.mockReturnValue(builder);

    const { result } = renderHook(() => useIncome());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
