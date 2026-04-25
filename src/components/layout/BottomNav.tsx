import { NavLink, useLocation } from 'react-router-dom';
import { Home, Receipt, Users, User, Wallet, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: Home,     label: 'Home'     },
  { to: '/expenses',  icon: Receipt,  label: 'Expenses' },
  { to: '/income',    icon: Wallet,   label: 'Income'   },
  { to: '/groups',    icon: Users,    label: 'Groups'   },
  { to: '/intelligence', icon: Brain, label: 'Intel'    },
  { to: '/profile',   icon: User,     label: 'Me'       },
];

export default function BottomNav() {
  const location = useLocation();
  const { light } = useHaptics();

  const handleNavTap = (isActive: boolean) => {
    if (isActive) return;
    light();
  };

  return (
    <nav
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-2 px-2 sm:px-4"
    >
      <div className="nav-pill flex items-center gap-0.5 px-1.5 sm:px-3 py-2 w-full max-w-sm">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                void handleNavTap(isActive);
              }}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1.5 rounded-full transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-primary/20 border border-primary/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  'relative h-5 w-5 transition-colors',
                  isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'relative text-[8px] sm:text-[9px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
