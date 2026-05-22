import { motion } from 'framer-motion';

interface ProgressRingProps {
  /** Progress from 0 to 1. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Center label; defaults to the percentage. */
  label?: string;
  color?: string;
}

/** Animated circular progress ring used for goals and health scores. */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  label,
  color = '#6C63FF',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-ink">
        {label ?? `${Math.round(clamped * 100)}%`}
      </span>
    </div>
  );
}
