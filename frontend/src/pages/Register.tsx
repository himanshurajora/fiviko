import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { useAuth } from '@/store/auth';
import { getErrorMessage } from '@/lib/api';

export function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '', baseCurrency: 'USD' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      // New users head to onboarding to build their financial profile.
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account ✨" subtitle="Start your smart-money journey.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => update('name')(e.target.value)}
          required
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={(e) => update('password')(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="baseCurrency" className="text-sm font-semibold text-ink">
            Base currency
          </label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            value={form.baseCurrency}
            onChange={(e) => update('baseCurrency')(e.target.value)}
            className="focus-ring h-12 rounded-2xl border border-muted-border bg-surface px-4 text-base text-ink"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
