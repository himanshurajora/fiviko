import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared frame for the login and register screens. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-gradient-app">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-ink-soft">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary font-extrabold text-white">
            F
          </span>
          <span className="font-bold text-ink">Fiviko</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
