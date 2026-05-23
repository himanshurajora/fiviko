import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/**
 * Runs a delete and immediately shows an Undo toast wired to the restore. The
 * delete actually fires server-side (we soft-delete the row so it isn't lost),
 * so canceling means re-POSTing /restore — that pattern is friendlier than
 * holding the request for 5 seconds before doing anything.
 */
export async function undoableDelete(args: {
  thing: string;
  doDelete: () => Promise<unknown>;
  doRestore: () => Promise<unknown>;
}): Promise<void> {
  try {
    await args.doDelete();
    notify.custom(`${args.thing} removed`, {
      tone: 'info',
      icon: '🗑️',
      sound: 'tap',
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            await args.doRestore();
            notify.custom(`${args.thing} restored`, { tone: 'success', icon: '↩️', sound: 'success' });
          } catch (err) {
            notify.error(getErrorMessage(err, 'Could not undo'));
          }
        },
      },
    });
  } catch (err) {
    notify.error(getErrorMessage(err, `Could not remove ${args.thing.toLowerCase()}`));
  }
}
