import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, hasUpdate, applyUpdate } = usePWA();

  if (isOnline && !hasUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      {!isOnline && (
        <div className="bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Changes will sync when online.</span>
        </div>
      )}
      {hasUpdate && (
        <div className="bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <RefreshCw className="h-4 w-4" />
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
