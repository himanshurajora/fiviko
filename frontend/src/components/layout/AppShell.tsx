import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { SidebarNav } from './SidebarNav';
import { OfflineIndicator } from './OfflineIndicator';

/**
 * Responsive app frame.
 * - Phones (< md): single column with a fixed bottom navigation.
 * - Tablet / desktop (>= md): a persistent left sidebar with a fluid content
 *   area that uses the full width (capped to keep line lengths comfortable).
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-gradient-app">
      <div className="flex">
        <SidebarNav />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <OfflineIndicator />
          <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
