import { FinancialPersonality } from '@fiviko/shared';

export const PERSONALITY_OPTIONS: {
  value: FinancialPersonality;
  label: string;
  emoji: string;
  tagline: string;
}[] = [
  { value: FinancialPersonality.CarefulSaver, label: 'Careful Saver', emoji: '🐢', tagline: 'Safety first, slow and steady.' },
  { value: FinancialPersonality.BalancedPlanner, label: 'Balanced Planner', emoji: '⚖️', tagline: 'A bit of saving, a bit of fun.' },
  { value: FinancialPersonality.DreamBuilder, label: 'Dream Builder', emoji: '🌈', tagline: 'Big goals drive my choices.' },
  { value: FinancialPersonality.AggressiveAchiever, label: 'Aggressive Achiever', emoji: '🚀', tagline: 'Move fast, grow wealth boldly.' },
];
