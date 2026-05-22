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
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6 pb-10 pt-10 md:pt-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-lg font-extrabold text-white shadow-soft">
              F
            </span>
            <span className="text-xl font-extrabold text-ink">Fiviko</span>
          </div>
          <Link to="/login" className="text-sm font-semibold text-primary">
            Sign in
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center gap-10 py-10 lg:flex-row lg:gap-16 lg:py-20">
          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 text-center lg:text-left"
          >
            <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-5xl">
              Can I buy this?
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Fiviko knows.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft lg:mx-0">
              Your playful money coach. Track spending, plan goals, and make confident purchase
              decisions — on any device.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/register">
                <Button size="lg" fullWidth className="sm:w-auto sm:px-10">
                  Get started — it’s free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" fullWidth className="sm:w-auto">
                  I have an account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Feature grid */}
          <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="card p-5"
              >
                <div className="text-3xl" aria-hidden>
                  {f.icon}
                </div>
                <h2 className="mt-3 font-bold text-ink">{f.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="mt-auto px-2 text-center text-xs leading-relaxed text-ink-soft">
          Fiviko provides educational insights based on your data and app-defined scoring models. It
          is not licensed financial advice.
        </p>
      </div>
    </div>
  );
}
