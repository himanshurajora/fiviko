import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBadges } from '@/lib/badges';

export function Badges() {
  const { data: badges, isLoading } = useBadges();
  const unlockedCount = badges?.filter((b) => b.unlocked).length ?? 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Badges</h1>
        {badges && (
          <span className="text-sm font-semibold text-ink-soft">
            {unlockedCount} / {badges.length} unlocked
          </span>
        )}
      </header>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-black/5" />
          ))}
        </div>
      )}

      {badges && badges.length === 0 && (
        <EmptyState icon="🏅" title="No badges yet" description="Earn badges by logging expenses, building streaks, and hitting your goals." />
      )}

      {badges && badges.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card padded animate={false} className={`flex h-full flex-col items-center gap-2 text-center ${b.unlocked ? '' : 'opacity-55 grayscale'}`}>
                <span className="text-4xl" aria-hidden>{b.unlocked ? b.icon : '🔒'}</span>
                <p className="text-sm font-bold text-ink">{b.name}</p>
                <p className="text-xs text-ink-soft">{b.description}</p>
                {b.unlocked && b.unlockedAt && (
                  <span className="mt-auto rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                    Unlocked
                  </span>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
