import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { OfflineIndicator } from './OfflineIndicator';

/**
 * App frame for authenticated screens: a centered mobile column, an offline
 * banner, scrollable content, and the fixed bottom navigation.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-gradient-app">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
        <OfflineIndicator />
        <main className="flex-1 px-4 pb-28 pt-4">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
