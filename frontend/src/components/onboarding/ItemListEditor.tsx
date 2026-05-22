import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export interface EditorItem {
  /** Selected option value (income type / expense category / asset type / liability type). */
  key: string;
  name?: string;
  amount: number;
  /** Second amount, e.g. a liability's monthly payment. */
  amount2?: number;
}

export interface EditorConfig {
  optionLabel: string;
  options: { value: string; label: string; emoji?: string }[];
  hasName?: boolean;
  amountLabel: string;
  secondAmountLabel?: string;
  addLabel: string;
}

/**
 * Controlled editor for a list of money items, reused by the income, mandatory
 * expense, asset and liability onboarding steps. Amounts are in base currency.
 */
export function ItemListEditor({
  items,
  onChange,
  config,
  currency,
}: {
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
  config: EditorConfig;
  currency: string;
}) {
  const update = (i: number, patch: Partial<EditorItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...items, { key: config.options[0].value, name: config.hasName ? '' : undefined, amount: 0, amount2: config.secondAmountLabel ? 0 : undefined }]);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col gap-2 p-3"
        >
          <div className="flex items-center gap-2">
            <select
              value={item.key}
              onChange={(e) => update(i, { key: e.target.value })}
              className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
              aria-label={config.optionLabel}
            >
              {config.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.emoji ? `${o.emoji} ` : ''}{o.label}
                </option>
              ))}
            </select>
            <button onClick={() => remove(i)} className="focus-ring rounded-full p-2 text-ink-soft hover:text-danger" aria-label="Remove">
              🗑️
            </button>
          </div>

          {config.hasName && (
            <input
              type="text"
              placeholder="Name (e.g. Savings account)"
              value={item.name ?? ''}
              onChange={(e) => update(i, { name: e.target.value })}
              className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
            />
          )}

          <div className="flex gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-soft">{config.amountLabel} ({currency})</span>
              <input
                type="number"
                inputMode="decimal"
                value={item.amount || ''}
                onChange={(e) => update(i, { amount: Number(e.target.value) })}
                className="focus-ring h-11 w-full rounded-2xl border border-muted-border bg-surface px-3 text-base font-semibold"
              />
            </label>
            {config.secondAmountLabel && (
              <label className="flex-1">
                <span className="mb-1 block text-xs text-ink-soft">{config.secondAmountLabel} ({currency})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.amount2 || ''}
                  onChange={(e) => update(i, { amount2: Number(e.target.value) })}
                  className="focus-ring h-11 w-full rounded-2xl border border-muted-border bg-surface px-3 text-base font-semibold"
                />
              </label>
            )}
          </div>
        </motion.div>
      ))}

      <Button variant="ghost" onClick={add} className="border border-dashed border-muted-border">
        ➕ {config.addLabel}
      </Button>
    </div>
  );
}
