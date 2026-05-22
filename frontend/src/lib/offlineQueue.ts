import type { ExpenseCategory, NeedOrWant, PaymentMethod } from '@fiviko/shared';

/**
 * Minimal IndexedDB-backed queue for expenses created while offline (spec §8.4).
 * Each item carries a stable `clientId` so the backend can de-duplicate on sync.
 */
export interface PendingExpense {
  clientId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string | null;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  needOrWant: NeedOrWant;
  linkedGoalId: string | null;
  /** When it was queued locally (for display ordering). */
  queuedAt: string;
}

const DB_NAME = 'fiviko';
const DB_VERSION = 1;
const STORE = 'pending-expenses';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clientId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = fn(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function queueExpense(expense: PendingExpense): Promise<void> {
  await tx('readwrite', (store) => store.put(expense));
}

export async function getQueuedExpenses(): Promise<PendingExpense[]> {
  const all = await tx<PendingExpense[]>('readonly', (store) => store.getAll() as IDBRequest<PendingExpense[]>);
  return all.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}

export async function removeQueuedExpenses(clientIds: string[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    clientIds.forEach((id) => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function countQueuedExpenses(): Promise<number> {
  return tx<number>('readonly', (store) => store.count());
}
