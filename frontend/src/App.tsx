import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/store/auth';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Expenses } from '@/pages/Expenses';
import { Goals } from '@/pages/Goals';
import { AddGoal } from '@/pages/AddGoal';
import { GoalDetail } from '@/pages/GoalDetail';
import { Badges } from '@/pages/Badges';
import { Reports } from '@/pages/Reports';
import { About } from '@/pages/About';
import { Profile } from '@/pages/Profile';
import { NetWorthTracker } from '@/pages/NetWorthTracker';

/** Forces new users through onboarding before they can reach the main app. */
function RequireOnboarding() {
  const user = useAuth((s) => s.user);
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** The onboarding route; bounces already-onboarded users back to the app. */
function OnboardingRoute() {
  const user = useAuth((s) => s.user);
  if (user?.onboardingCompleted) return <Navigate to="/app" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingRoute />} />

        <Route element={<RequireOnboarding />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="networth" element={<NetWorthTracker />} />
            <Route path="goals" element={<Goals />} />
            <Route path="goals/new" element={<AddGoal />} />
            <Route path="goals/:id" element={<GoalDetail />} />
            <Route path="badges" element={<Badges />} />
            <Route path="reports" element={<Reports />} />
            <Route path="about" element={<About />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
