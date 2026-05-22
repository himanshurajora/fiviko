import { GoalCategory, GoalPriority, GoalType, Recommendation } from '@fiviko/shared';

interface RecMeta {
  label: string;
  emoji: string;
  /** Tailwind classes for a solid badge. */
  badge: string;
  /** Soft background for cards. */
  soft: string;
  text: string;
}

export const RECOMMENDATION_META: Record<Recommendation, RecMeta> = {
  [Recommendation.BuyNow]: { label: 'Buy Now', emoji: '✅', badge: 'bg-success text-white', soft: 'bg-success/10', text: 'text-success' },
  [Recommendation.Wait]: { label: 'Wait', emoji: '⏳', badge: 'bg-warning text-white', soft: 'bg-warning/10', text: 'text-warning' },
  [Recommendation.ReduceBudget]: { label: 'Reduce Budget', emoji: '✂️', badge: 'bg-accent-orange text-white', soft: 'bg-accent-orange/10', text: 'text-accent-orange' },
  [Recommendation.NotRecommended]: { label: 'Not Recommended', emoji: '🛑', badge: 'bg-danger text-white', soft: 'bg-danger/10', text: 'text-danger' },
  [Recommendation.HardWarning]: { label: 'Hard Warning', emoji: '⚠️', badge: 'bg-danger text-white', soft: 'bg-danger/15', text: 'text-danger' },
};

export const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; emoji: string }> = {
  [GoalCategory.House]: { label: 'House', emoji: '🏠' },
  [GoalCategory.Car]: { label: 'Car', emoji: '🚗' },
  [GoalCategory.Bike]: { label: 'Bike', emoji: '🏍️' },
  [GoalCategory.Laptop]: { label: 'Laptop', emoji: '💻' },
  [GoalCategory.Phone]: { label: 'Phone', emoji: '📱' },
  [GoalCategory.Education]: { label: 'Education / Course', emoji: '🎓' },
  [GoalCategory.BusinessEquipment]: { label: 'Business Equipment', emoji: '🛠️' },
  [GoalCategory.Travel]: { label: 'Travel', emoji: '✈️' },
  [GoalCategory.Health]: { label: 'Health', emoji: '❤️' },
  [GoalCategory.Family]: { label: 'Family', emoji: '👨‍👩‍👧' },
  [GoalCategory.Hobby]: { label: 'Hobby', emoji: '🎨' },
  [GoalCategory.Luxury]: { label: 'Luxury', emoji: '💎' },
  [GoalCategory.EmergencyFund]: { label: 'Emergency Fund', emoji: '🚑' },
  [GoalCategory.Other]: { label: 'Other', emoji: '📦' },
};

export const GOAL_CATEGORY_OPTIONS = Object.entries(GOAL_CATEGORY_META).map(([value, meta]) => ({
  value: value as GoalCategory,
  ...meta,
}));

export const GOAL_TYPE_OPTIONS = [
  { value: GoalType.ShortTerm, label: 'Short-term', helper: 'Within a year' },
  { value: GoalType.LongTerm, label: 'Long-term', helper: 'A year or more' },
];

export const GOAL_PRIORITY_OPTIONS = [
  { value: GoalPriority.Low, label: 'Low' },
  { value: GoalPriority.Medium, label: 'Medium' },
  { value: GoalPriority.High, label: 'High' },
];
