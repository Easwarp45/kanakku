import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionSecondary?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionSecondary,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted animate-pulse">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
      {(action || actionSecondary) && (
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
            </Button>
          )}
          {actionSecondary && (
            <Button variant="outline" onClick={actionSecondary.onClick}>
              {actionSecondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
