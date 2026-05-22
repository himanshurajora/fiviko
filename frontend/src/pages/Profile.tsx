import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/auth';

export function Profile() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  async function onLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Profile</h1>

      <Card padded className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-xl font-bold text-white">
          {(user?.name ?? 'F').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-lg font-bold text-ink">{user?.name}</p>
          <p className="text-sm text-ink-soft">{user?.email}</p>
          <p className="mt-1 text-xs text-ink-soft">Base currency: {user?.baseCurrency}</p>
        </div>
      </Card>

      <Card padded>
        <h2 className="font-bold text-ink">About Fiviko</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fiviko is a financial planning and decision-support tool. It provides educational insights
          based on user-entered data and app-defined scoring models. It does not provide licensed
          financial, investment, tax, or legal advice. Please verify important financial decisions
          independently or consult a qualified professional.
        </p>
      </Card>

      <Button variant="danger" fullWidth onClick={onLogout}>
        Log out
      </Button>
    </div>
  );
}
