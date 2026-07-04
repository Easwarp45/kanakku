import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { getUnsyncedExpenses } from '@/lib/offlineStorage';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [pendingCount, setPendingCount] = useState(0);

  // OFF-3: Show how many expenses are pending sync so users know data is safe
  useEffect(() => {
    if (!isOnline) {
      getUnsyncedExpenses().then((items) => setPendingCount(items.length));
    } else {
      setPendingCount(0);
    }
  }, [isOnline]);

  if (isOnline) return null;

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
    </div>
  );
}
