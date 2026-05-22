import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { icon: '🧾', title: 'Track in seconds', text: 'Log any expense in under 10 seconds, even offline.' },
  { icon: '🎯', title: 'Plan your goals', text: 'Set short and long-term goals and watch them grow.' },
  { icon: '🧠', title: 'Decide smart', text: 'Get a clear Buy / Wait / Avoid call on every purchase.' },
  { icon: '🏅', title: 'Stay motivated', text: 'Streaks, badges and levels make saving fun.' },
];

export function Landing() {
  return (
    <div className="min-h-dvh bg-gradient-app">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-3xl font-extrabold text-white shadow-soft">
            F
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-ink">
            Can I buy this?
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Fiviko knows.</span>
          </h1>
          <p className="mt-3 text-ink-soft">
            Your playful money coach. Track spending, plan goals, and make confident purchase
            decisions.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="card p-4"
            >
              <div className="text-2xl" aria-hidden>
                {f.icon}
              </div>
              <h2 className="mt-2 font-bold text-ink">{f.title}</h2>
              <p className="mt-1 text-xs text-ink-soft">{f.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Link to="/register">
            <Button size="lg" fullWidth>
              Get started — it’s free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="ghost" fullWidth>
              I already have an account
            </Button>
          </Link>
          <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft">
            Fiviko provides educational insights based on your data and app-defined scoring models.
            It is not licensed financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
