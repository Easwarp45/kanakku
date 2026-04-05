import { cn } from '@/lib/utils';

/**
 * Kanakku brand logo — uses the official PNG logo asset.
 *
 * Usage:
 *   <KanakkuLogo size={48} />                  — icon only
 *   <KanakkuLogo size={48} showName />          — icon + "Kanakku" wordmark
 *   <KanakkuLogo size={48} showName tagline />  — icon + name + tagline
 *   <KanakkuLogo size={48} showName vertical />  — stacked vertically
 */

interface KanakkuLogoProps {
  /** Width/height of the logo image in px */
  size?: number;
  /** Show the "Kanakku" text beside/below the icon */
  showName?: boolean;
  /** Show the tagline "your money, your vibe 💜" */
  tagline?: boolean;
  /** Stack icon + name vertically (default = row) */
  vertical?: boolean;
  /** Additional className on the outer wrapper */
  className?: string;
}

export function KanakkuLogo({
  size = 40,
  showName = false,
  tagline = false,
  vertical = false,
  className,
}: KanakkuLogoProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        vertical && 'flex-col gap-1.5',
        className,
      )}
    >
      {/* Official logo PNG */}
      <img
        src="/logo.png"
        alt="Kanakku logo"
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(0,207,255,0.4)]"
        style={{ width: size, height: size }}
        draggable={false}
      />

      {/* Wordmark + tagline */}
      {(showName || tagline) && (
        <div className={cn('flex flex-col', vertical && 'items-center')}>
          {showName && (
            <span
              className="font-display font-bold leading-none"
              style={{
                fontSize: size * 0.42,
                background: 'linear-gradient(135deg,#00CFFF 0%,#00E87A 50%,#CCFF00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kanakku
            </span>
          )}
          {tagline && (
            <span
              className="text-muted-foreground leading-none mt-0.5"
              style={{ fontSize: Math.max(10, size * 0.2) }}
            >
              your money, your vibe 💜
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact icon-only version — just the logo image, no text.
 */
export function KanakkuIcon({ size = 28, className }: { size?: number; className?: string }) {
  return <KanakkuLogo size={size} className={className} />;
}
