import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { getUnsyncedExpenses } from '@/lib/offlineStorage';

export function OfflineIndicator() {
  const { isOnline, hasUpdate, applyUpdate } = usePWA();
  const [pendingCount, setPendingCount] = useState(0);

  // OFF-3: Show how many expenses are pending sync so users know data is safe
  useEffect(() => {
    if (!isOnline) {
      getUnsyncedExpenses().then((items) => setPendingCount(items.length));
    } else {
      setPendingCount(0);
    }
  }, [isOnline]);

  if (isOnline && !hasUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      {!isOnline && (
        <div className="bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Offline
            {pendingCount > 0
              ? ` · ${pendingCount} expense${pendingCount > 1 ? 's' : ''} pending sync`
              : ' · changes will sync when online'}
          </span>
        </div>
      )}
      {hasUpdate && (
        <div className="bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>New version available!</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={applyUpdate}
            className="h-7 text-xs"
          >
            Update Now
          </Button>
        </div>
      )}
    </div>
  );
}
