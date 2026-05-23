import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { AssetDTO } from '@fiviko/shared';
import { useAssetHistory } from '@/lib/finances';
import { formatCurrency } from '@/lib/format';
import { ASSET_OPTIONS } from '@/lib/financeMeta';

const emojiFor = (type: string) => ASSET_OPTIONS.find((o) => o.value === type)?.emoji ?? '📦';

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface Props {
  asset: AssetDTO;
  baseCurrency: string;
  /** Live conversion rate from this asset's native currency to base. */
  rateToBase: number;
  /** Notifies the page so the running total updates live as the user edits. */
  onLiveChange: (assetId: string, baseAmount: number) => void;
  onCommit: (assetId: string, amount: number) => Promise<void>;
  saving?: boolean;
}

/** One editable balance row with a mini history sparkline. */
export function AssetRowEditor({ asset, baseCurrency, rateToBase, onLiveChange, onCommit, saving }: Props) {
  const [draft, setDraft] = useState(String(asset.amount));
  const [committedAmount, setCommittedAmount] = useState(asset.amount);
  const { data: history } = useAssetHistory(asset.id, 180);

  // Keep the input synced if the asset is updated elsewhere.
  useEffect(() => {
    setDraft(String(asset.amount));
    setCommittedAmount(asset.amount);
  }, [asset.amount, asset.id]);

  const parsed = Number(draft);
  const liveBase = Number.isFinite(parsed) ? parsed * rateToBase : asset.baseCurrencyAmount;
  // Tell the parent how much *this* row contributes right now, so the page total
  // re-totals optimistically as you type — no round trip.
  useEffect(() => {
    onLiveChange(asset.id, liveBase);
  }, [liveBase, asset.id, onLiveChange]);

  async function commit() {
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === committedAmount) return;
    await onCommit(asset.id, parsed);
    setCommittedAmount(parsed);
  }

  const points = (history ?? []).map((p, i) => ({ i, v: p.amount }));
  const showSpark = points.length >= 2;

  return (
    <div className="border-b border-muted-border last:border-b-0">
      <div className="flex items-center gap-3 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5 text-lg" aria-hidden>
          {emojiFor(asset.type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{asset.name}</p>
          <p className="text-[11px] text-ink-soft">Updated {timeAgo(asset.updatedAt)}</p>
        </div>

        {showSpark && (
          <div className="hidden h-8 w-20 shrink-0 sm:block" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <Line type="monotone" dataKey="v" stroke="#6C63FF" strokeWidth={1.8} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              disabled={saving}
              className="focus-ring h-9 w-28 rounded-xl border border-muted-border bg-surface px-2 text-right text-sm font-bold text-ink"
            />
            <span className="w-9 text-[11px] font-semibold text-ink-soft">{asset.currency}</span>
          </div>
          {asset.currency !== baseCurrency && (
            <p className="mt-0.5 text-[11px] text-ink-soft">
              ≈ {formatCurrency(liveBase, baseCurrency)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
