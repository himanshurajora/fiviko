import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { useLevel } from '@/lib/gamification';
import { useSound, playSound } from '@/lib/sound';
import { useAuth } from '@/store/auth';
import { PERSONALITY_OPTIONS } from '@/lib/personality';

/**
 * Profile & Settings — account info, level, preferences and legal copy.
 *
 * Finance CRUD (income, bills, accounts, debts) intentionally lives in the
 * Money tab now, not here. Settings is for "who you are", not "what you have".
 */
export function Profile() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const cur = user?.baseCurrency ?? 'USD';

  const { data: level } = useLevel();
  const soundEnabled = useSound((s) => s.enabled);
  const toggleSound = useSound((s) => s.toggle);
  const personality = PERSONALITY_OPTIONS.find((p) => p.value === user?.financialPersonality);

  function onToggleSound() {
    toggleSound();
    if (!soundEnabled) playSound('success'); // preview when turning on
  }

  async function onLogout() {
    await logout();
    navigate('/', { replace: true });
  }
  async function onDelete() {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    await deleteAccount();
    navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Profile & Settings</h1>

      <Card padded animate={false} className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-xl font-bold text-white">
          {(user?.name ?? 'F').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink">{user?.name}</p>
          <p className="truncate text-sm text-ink-soft">{user?.email}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {cur}{personality && ` · ${personality.emoji} ${personality.label}`}
          </p>
        </div>
      </Card>

      {level && (
        <Card padded animate={false} className="bg-gradient-primary">
          <LevelBadge level={level} variant="light" />
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/money" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>💎</p>
            <p className="mt-1 font-bold text-ink">My money</p>
            <p className="text-xs text-ink-soft">Accounts, debts, income, bills →</p>
          </Card>
        </Link>
        <Link to="/app/reports" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>📊</p>
            <p className="mt-1 font-bold text-ink">Monthly report</p>
            <p className="text-xs text-ink-soft">Trends & insights →</p>
          </Card>
        </Link>
        <Link to="/app/badges" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>🏅</p>
            <p className="mt-1 font-bold text-ink">Badges</p>
            <p className="text-xs text-ink-soft">What you’ve unlocked →</p>
          </Card>
        </Link>
        <Link to="/app/about" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>📚</p>
            <p className="mt-1 font-bold text-ink">About & research</p>
            <p className="text-xs text-ink-soft">How Fiviko works →</p>
          </Card>
        </Link>
      </div>

      {/* Preferences */}
      <Card padded animate={false}>
        <h2 className="font-bold text-ink">Preferences</h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">Sound effects 🔊</p>
            <p className="text-xs text-ink-soft">Playful cues when you log, save and level up.</p>
          </div>
          <button
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle sound effects"
            onClick={onToggleSound}
            className={`focus-ring relative h-7 w-12 rounded-full transition-colors ${soundEnabled ? 'bg-primary' : 'bg-muted-border'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${soundEnabled ? 'left-[1.375rem]' : 'left-0.5'}`} />
          </button>
        </div>
      </Card>

      {/* Legal */}
      <Card padded animate={false}>
        <h2 className="font-bold text-ink">Disclaimer</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fiviko is a financial planning and decision-support tool. It provides educational insights based on
          user-entered data and app-defined scoring models. It does not provide licensed financial, investment,
          tax, or legal advice. Users should verify important financial decisions independently or consult a
          qualified professional.
        </p>
      </Card>

      {/* Account actions */}
      <div className="mt-2 flex flex-col gap-3">
        <Button variant="ghost" fullWidth onClick={onLogout}>Log out</Button>
        <button onClick={onDelete} className="focus-ring rounded-2xl py-2 text-sm font-semibold text-danger">
          Delete my account & data
        </button>
      </div>
    </div>
  );
}
