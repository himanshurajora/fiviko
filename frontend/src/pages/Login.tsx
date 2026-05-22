import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/store/auth';
import { getErrorMessage } from '@/lib/api';

export function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Sign in to keep your streak alive.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Fiviko?{' '}
        <Link to="/register" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
