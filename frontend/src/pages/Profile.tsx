import { Link, useNavigate } from 'react-router-dom';
import { Frequency, LiquidityType } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileSection, type AddFormValue, type ProfileItem } from '@/components/settings/ProfileSection';
import { useAuth } from '@/store/auth';
import {
  useAssetMutations,
  useAssets,
  useIncomeMutations,
  useIncomes,
  useLiabilities,
  useLiabilityMutations,
  useMandatoryExpenses,
  useMandatoryMutations,
} from '@/lib/finances';
import {
  ASSET_LIQUIDITY,
  ASSET_OPTIONS,
  INCOME_OPTIONS,
  LIABILITY_OPTIONS,
  MANDATORY_OPTIONS,
} from '@/lib/financeMeta';
import { PERSONALITY_OPTIONS } from '@/lib/personality';
import { formatCurrency } from '@/lib/format';

const labelOf = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

export function Profile() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const cur = user?.baseCurrency ?? 'USD';

  const incomes = useIncomes();
  const mandatory = useMandatoryExpenses();
  const assets = useAssets();
  const liabilities = useLiabilities();
  const incomeM = useIncomeMutations();
  const mandatoryM = useMandatoryMutations();
  const assetM = useAssetMutations();
  const liabilityM = useLiabilityMutations();

  const personality = PERSONALITY_OPTIONS.find((p) => p.value === user?.financialPersonality);

  async function onLogout() {
    await logout();
    navigate('/', { replace: true });
  }
  async function onDelete() {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    await deleteAccount();
    navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Profile & Settings</h1>

      <Card padded animate={false} className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-xl font-bold text-white">
          {(user?.name ?? 'F').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink">{user?.name}</p>
          <p className="truncate text-sm text-ink-soft">{user?.email}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {cur}{personality && ` · ${personality.emoji} ${personality.label}`}
          </p>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/reports" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>📊</p>
            <p className="mt-1 font-bold text-ink">Monthly report</p>
            <p className="text-xs text-ink-soft">Trends & insights →</p>
          </Card>
        </Link>
        <Link to="/app/about" className="focus-ring">
          <Card padded animate={false} className="h-full">
            <p className="text-2xl" aria-hidden>📚</p>
            <p className="mt-1 font-bold text-ink">About & research</p>
            <p className="text-xs text-ink-soft">How Fiviko works →</p>
          </Card>
        </Link>
      </div>

      {/* Financial profile editors */}
      <h2 className="mt-2 text-lg font-extrabold text-ink">Your financial profile</h2>

      <ProfileSection
        title="Income" emoji="💰" baseCurrency={cur} options={INCOME_OPTIONS} amountLabel="Monthly amount"
        adding={incomeM.create.isPending}
        items={(incomes.data ?? []).map<ProfileItem>((i) => ({ id: i.id, title: labelOf(INCOME_OPTIONS, i.type), subtitle: i.frequency.toLowerCase(), amount: i.amount, currency: i.currency }))}
        onAdd={(v: AddFormValue) => incomeM.create.mutateAsync({ type: v.key as never, amount: v.amount, currency: cur, frequency: Frequency.Monthly })}
        onDelete={(id) => incomeM.remove.mutate(id)}
      />

      <ProfileSection
        title="Monthly must-pays" emoji="🏠" baseCurrency={cur} options={MANDATORY_OPTIONS} amountLabel="Monthly amount"
        adding={mandatoryM.create.isPending}
        items={(mandatory.data ?? []).map<ProfileItem>((m) => ({ id: m.id, title: labelOf(MANDATORY_OPTIONS, m.category), subtitle: m.frequency.toLowerCase(), amount: m.amount, currency: m.currency }))}
        onAdd={(v) => mandatoryM.create.mutateAsync({ category: v.key as never, amount: v.amount, currency: cur, frequency: Frequency.Monthly })}
        onDelete={(id) => mandatoryM.remove.mutate(id)}
      />

      <ProfileSection
        title="Assets" emoji="🏦" baseCurrency={cur} options={ASSET_OPTIONS} hasName amountLabel="Value"
        adding={assetM.create.isPending}
        items={(assets.data ?? []).map<ProfileItem>((a) => ({ id: a.id, title: a.name, subtitle: labelOf(ASSET_OPTIONS, a.type), amount: a.amount, currency: a.currency }))}
        onAdd={(v) => assetM.create.mutateAsync({ type: v.key as never, name: v.name || labelOf(ASSET_OPTIONS, v.key), amount: v.amount, currency: cur, liquidityType: ASSET_LIQUIDITY[v.key] ?? LiquidityType.SemiLiquid })}
        onDelete={(id) => assetM.remove.mutate(id)}
      />

      <ProfileSection
        title="Debts & EMIs" emoji="💳" baseCurrency={cur} options={LIABILITY_OPTIONS} hasName amountLabel="Outstanding" secondAmountLabel="Monthly payment"
        adding={liabilityM.create.isPending}
        items={(liabilities.data ?? []).map<ProfileItem>((l) => ({ id: l.id, title: l.name, subtitle: `${labelOf(LIABILITY_OPTIONS, l.type)} · ${formatCurrency(l.monthlyPayment, l.currency)}/mo`, amount: l.outstandingAmount, currency: l.currency }))}
        onAdd={(v) => liabilityM.create.mutateAsync({ type: v.key as never, name: v.name || labelOf(LIABILITY_OPTIONS, v.key), outstandingAmount: v.amount, monthlyPayment: v.amount2, currency: cur })}
        onDelete={(id) => liabilityM.remove.mutate(id)}
      />

      {/* Legal */}
      <Card padded animate={false}>
        <h2 className="font-bold text-ink">Disclaimer</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fiviko is a financial planning and decision-support tool. It provides educational insights based on
          user-entered data and app-defined scoring models. It does not provide licensed financial, investment,
          tax, or legal advice. Users should verify important financial decisions independently or consult a
          qualified professional.
        </p>
      </Card>

      {/* Account actions */}
      <div className="mt-2 flex flex-col gap-3">
        <Button variant="ghost" fullWidth onClick={onLogout}>Log out</Button>
        <button onClick={onDelete} className="focus-ring rounded-2xl py-2 text-sm font-semibold text-danger">
          Delete my account & data
        </button>
      </div>
    </div>
  );
}
