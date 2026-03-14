import { NavLink, useLocation } from 'react-router-dom';
import { Home, Receipt, Users, BarChart3, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: Wallet, label: 'Income' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-xs">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
