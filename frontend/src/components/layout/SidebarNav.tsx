import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/store/auth';
import { playSound } from '@/lib/sound';

const ITEMS = [
  { to: '/app', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/app/money', label: 'Money', icon: '💎', end: false },
  { to: '/app/expenses', label: 'Expenses', icon: '🧾', end: false },
  { to: '/app/goals', label: 'Goals', icon: '🎯', end: false },
  { to: '/app/reports', label: 'Reports', icon: '📊', end: false },
  { to: '/app/badges', label: 'Badges', icon: '🏅', end: false },
  { to: '/app/profile', label: 'Settings', icon: '⚙️', end: false },
];

/** Persistent left navigation for tablet and desktop (hidden on phones). */
export function SidebarNav() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  async function onLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-muted-border bg-surface/70 px-4 py-6 backdrop-blur md:flex">
      <NavLink to="/app" className="mb-8 flex items-center gap-2 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-lg font-extrabold text-white">
          F
        </span>
        <span className="text-xl font-extrabold text-ink">Fiviko</span>
      </NavLink>

      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => playSound('sweep')}
                className={({ isActive }) =>
                  clsx(
                    'focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-ink-soft hover:bg-black/5 hover:text-ink',
                  )
                }
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl px-2 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary font-bold text-white">
          {(user?.name ?? 'F').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{user?.name}</p>
          <button
            onClick={onLogout}
            className="focus-ring rounded text-xs font-medium text-ink-soft hover:text-danger"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
