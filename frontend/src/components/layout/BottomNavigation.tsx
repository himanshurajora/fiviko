import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { playSound } from '@/lib/sound';

const ITEMS = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/expenses', label: 'Expenses', icon: '🧾', end: false },
  { to: '/app/goals', label: 'Goals', icon: '🎯', end: false },
  { to: '/app/badges', label: 'Badges', icon: '🏅', end: false },
  { to: '/app/profile', label: 'Profile', icon: '👤', end: false },
];

/** Mobile-first bottom navigation (spec §7). */
export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-muted-border bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              onClick={() => playSound('sweep')}
              className={({ isActive }) =>
                clsx(
                  'focus-ring flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition',
                  isActive ? 'text-primary' : 'text-ink-soft',
                )
              }
            >
              <span className="text-xl" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
