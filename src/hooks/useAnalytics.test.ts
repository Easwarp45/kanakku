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
import { useAnalytics } from './useAnalytics';

function createThenableBuilder(payload: unknown) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(payload).then(onFulfilled, onRejected),
  };

  return builder;
}

describe('useAnalytics', () => {
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

  it('calculates totals and net savings from expenses and income', async () => {
    const currentExpenseBuilder = createThenableBuilder({
      data: [
        { category: 'food', amount: 200, expense_date: '2026-04-01' },
        { category: 'transport', amount: 100, expense_date: '2026-04-02' },
      ],
      error: null,
    });

    const previousExpenseBuilder = createThenableBuilder({
      data: [{ amount: 150 }],
      error: null,
    });

    const incomeBuilder = createThenableBuilder({
      data: [{ amount: 1000 }],
      error: null,
    });

    let expenseCall = 0;
    mockFromFn.mockImplementation((table: string) => {
      if (table === 'expenses') {
        expenseCall += 1;
        return expenseCall === 1 ? currentExpenseBuilder : previousExpenseBuilder;
      }

      if (table === 'income') {
        return incomeBuilder;
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAnalytics('month'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.totalSpent).toBe(300);
    expect(result.current.data?.totalIncome).toBe(1000);
    expect(result.current.data?.netSavings).toBe(700);
    expect(result.current.data?.transactionCount).toBe(2);
  });
});
