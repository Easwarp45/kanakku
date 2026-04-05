import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { Insight } from '@/types/insights';
import { useCurrency } from '@/hooks/useCurrency';

interface InsightWhyDrawerProps {
  insight: Insight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightWhyDrawer({ insight, open, onOpenChange }: InsightWhyDrawerProps) {
  const { formatLocalCurrency, formatLocalNumber } = useCurrency();

  const formatWhyValue = (value: number) => {
    if (!insight) return '0';

    if (insight.why.valueKind === 'count') {
      return formatLocalNumber(value, { maximumFractionDigits: 0 });
    }

    if (insight.why.valueKind === 'ratio') {
      return formatLocalNumber(value, { maximumFractionDigits: 2 });
    }

    return formatLocalCurrency(value, { maximumFractionDigits: 2 });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>Why this insight?</DrawerTitle>
          <DrawerDescription>
            Rule-based comparison from your latest expense patterns.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          <div className="rounded-[16px] border bg-card p-4">
            <p className="text-sm font-semibold">{insight?.title || 'Insight details'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{insight?.message || 'Insight explanation'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border bg-card p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Previous</p>
              <p className="mt-1 text-base font-semibold">{formatWhyValue(insight?.why.previous || 0)}</p>
            </div>

            <div className="rounded-[16px] border bg-card p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current</p>
              <p className="mt-1 text-base font-semibold">{formatWhyValue(insight?.why.current || 0)}</p>
            </div>
          </div>

          <div className="rounded-[16px] border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Change</p>
            <p className="mt-1 text-base font-semibold">{insight?.why.change || '0%'}</p>
          </div>

          <div className="rounded-[16px] border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reason</p>
            <p className="mt-1 text-sm leading-relaxed">{insight?.why.reason || 'No detailed reason available.'}</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
