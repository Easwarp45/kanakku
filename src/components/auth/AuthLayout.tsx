import { ReactNode } from "react";
import { KanakkuLogo } from "@/components/ui/KanakkuLogo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background safe-top safe-bottom">
      {/* Glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-[80px]" />
      </div>

      {/* Header with branding */}
      <div className="relative flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <KanakkuLogo size={72} showName vertical />
        <h1 className="mt-5 text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-center text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Form content */}
      <div className="relative flex-1 px-6 pb-8">{children}</div>
    </div>
  );
}