import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { SidebarNav } from './SidebarNav';
import { OfflineIndicator } from './OfflineIndicator';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { useExpenseModal } from '@/store/expenseModal';
import { useOfflineSync } from '@/lib/expenses';

/**
 * Responsive app frame.
 * - Phones (< md): single column with a fixed bottom navigation + a floating
 *   quick-add button.
 * - Tablet / desktop (>= md): a persistent left sidebar with a fluid content area.
 * Also hosts the global Add-Expense modal and starts offline-sync.
 */
export function AppShell() {
  const openModal = useExpenseModal((s) => s.openModal);
  useOfflineSync();

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

      {/* Floating quick-add (phones only; desktop uses the in-page buttons). */}
      <button
        onClick={() => openModal()}
        aria-label="Add expense"
        className="focus-ring fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-2xl text-white shadow-soft md:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        ➕
      </button>

      <BottomNavigation />
      <AddExpenseModal />
    </div>
  );
}
