import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { createMockUser } from '@/test/mocks';

// Use vi.hoisted to create values that can be safely referenced in mocks
const { mockRpcFn, mockFromFn, mockChannelFn, mockRemoveChannelFn } = vi.hoisted(() => ({
  mockRpcFn: vi.fn(),
  mockFromFn: vi.fn(),
  mockChannelFn: vi.fn(),
  mockRemoveChannelFn: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: mockFromFn,
    rpc: mockRpcFn,
    channel: mockChannelFn,
    removeChannel: mockRemoveChannelFn,
  },
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => {
    const user = createMockUser();
    return {
      user,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    };
  }),
}));

// Import after mocks
import { useCheckMyMembership, useMemberRemovalListener } from './useGroups';

const mockUser = createMockUser();

describe('useCheckMyMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user is a member of the group', async () => {
    const groupId = 'test-group-id';

    mockRpcFn.mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const { result } = renderHook(() => useCheckMyMembership(groupId));

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockRpcFn).toHaveBeenCalledWith('check_my_group_membership', {
      group_uuid: groupId,
    });
  });

  it('should return false when user is not a member', async () => {
    const groupId = 'test-group-id';

    mockRpcFn.mockResolvedValueOnce({
      data: false,
      error: null,
    });

    const { result } = renderHook(() => useCheckMyMembership(groupId));

    await waitFor(() => {
      expect(result.current.data).toBe(false);
    });
  });

  it('should fall back to direct query when RPC fails', async () => {
    const groupId = 'test-group-id';

    mockRpcFn.mockResolvedValueOnce({
      data: null,
      error: { message: 'RPC not found' },
    });

    mockFromFn.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'member-id' },
        error: null,
      }),
    });

    const { result } = renderHook(() => useCheckMyMembership(groupId));

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockFromFn).toHaveBeenCalledWith('group_members');
  });

  it('should return true by default when groupId is undefined', async () => {
    const { result } = renderHook(() => useCheckMyMembership(undefined));

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });

    expect(mockRpcFn).not.toHaveBeenCalled();
  });
});

describe('useMemberRemovalListener', () => {
  let mockChannelInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockChannelInstance = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    };

    mockChannelFn.mockReturnValue(mockChannelInstance);
  });

  it('should set up a real-time subscription for member removal', () => {
    const groupId = 'test-group-id';
    const onRemoved = vi.fn();

    renderHook(() => useMemberRemovalListener(groupId, onRemoved));

    expect(mockChannelFn).toHaveBeenCalledWith(
      `removal-notifications-${groupId}-${mockUser.id}`
    );

    expect(mockChannelInstance.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'member_removal_notifications',
        filter: `removed_user_id=eq.${mockUser.id}`,
      }),
      expect.any(Function)
    );

    expect(mockChannelInstance.subscribe).toHaveBeenCalled();
  });

  it('should call onRemoved when a removal notification is received', async () => {
    const groupId = 'test-group-id';
    const onRemoved = vi.fn();

    let capturedCallback: any;
    mockChannelInstance.on.mockImplementation((event: any, config: any, callback: any) => {
      capturedCallback = callback;
      return mockChannelInstance;
    });

    renderHook(() => useMemberRemovalListener(groupId, onRemoved));

    const payload = {
      new: {
        id: 'notification-id',
        group_id: groupId,
        removed_user_id: mockUser.id,
        removed_by: 'admin-id',
        created_at: new Date().toISOString(),
      },
    };

    capturedCallback(payload);

    await waitFor(() => {
      expect(onRemoved).toHaveBeenCalled();
    });
  });

  it('should not call onRemoved for notifications from other groups', async () => {
    const groupId = 'test-group-id';
    const otherGroupId = 'other-group-id';
    const onRemoved = vi.fn();

    let capturedCallback: any;
    mockChannelInstance.on.mockImplementation((event: any, config: any, callback: any) => {
      capturedCallback = callback;
      return mockChannelInstance;
    });

    renderHook(() => useMemberRemovalListener(groupId, onRemoved));

    const payload = {
      new: {
        id: 'notification-id',
        group_id: otherGroupId,
        removed_user_id: mockUser.id,
        removed_by: 'admin-id',
        created_at: new Date().toISOString(),
      },
    };

    capturedCallback(payload);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('should clean up subscription on unmount', () => {
    const groupId = 'test-group-id';
    const onRemoved = vi.fn();

    const { unmount } = renderHook(() =>
      useMemberRemovalListener(groupId, onRemoved)
    );

    unmount();

    expect(mockRemoveChannelFn).toHaveBeenCalledWith(mockChannelInstance);
  });

  it('should not subscribe when groupId is undefined', () => {
    const onRemoved = vi.fn();

    renderHook(() => useMemberRemovalListener(undefined, onRemoved));

    expect(mockChannelFn).not.toHaveBeenCalled();
  });
});
