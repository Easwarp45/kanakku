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
import { useExpenses } from './useExpenses';

function createThenableBuilder(payload: unknown) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(payload).then(onFulfilled, onRejected),
  };

  return builder;
}

describe('useExpenses', () => {
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

  it('maps amount to number and applies date filters', async () => {
    const builder = createThenableBuilder({
      data: [
        {
          id: 'exp-1',
          amount: '140.25',
          category: 'food',
          description: 'Lunch',
          payment_method: 'upi',
          expense_date: '2026-04-10',
          updated_at: '2026-04-10T10:00:00Z',
        },
      ],
      error: null,
    });

    mockFromFn.mockReturnValue(builder);

    const { result } = renderHook(() => useExpenses({ startDate: '2026-04-01', endDate: '2026-04-30' }));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].amount).toBe(140.25);
    expect(builder.gte).toHaveBeenCalledWith('expense_date', '2026-04-01');
    expect(builder.lte).toHaveBeenCalledWith('expense_date', '2026-04-30');
  });

  it('returns empty array when backend returns no rows', async () => {
    const builder = createThenableBuilder({ data: [], error: null });
    mockFromFn.mockReturnValue(builder);

    const { result } = renderHook(() => useExpenses());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
