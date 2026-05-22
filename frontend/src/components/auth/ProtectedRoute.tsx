import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/auth';

/** Gates the authenticated app. Waits for the session check, then redirects. */
export function ProtectedRoute() {
  const user = useAuth((s) => s.user);
  const initializing = useAuth((s) => s.initializing);

  if (initializing) {
    return (
      <div className="grid min-h-dvh place-items-center bg-gradient-app">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
