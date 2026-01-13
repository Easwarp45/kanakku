import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background safe-top safe-bottom">
      {/* Header with branding */}
      <div className="flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <span className="text-3xl font-bold">₹</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-center text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Form content */}
      <div className="flex-1 px-6 pb-8">{children}</div>
    </div>
  );
}