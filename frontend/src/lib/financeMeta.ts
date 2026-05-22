import {
  AssetType,
  IncomeType,
  LiabilityType,
  LiquidityType,
  MandatoryExpenseCategory,
} from '@fiviko/shared';

export const INCOME_OPTIONS = [
  { value: IncomeType.Salary, label: 'Salary', emoji: '💼' },
  { value: IncomeType.Freelance, label: 'Freelance', emoji: '🧑‍💻' },
  { value: IncomeType.Business, label: 'Business', emoji: '🏪' },
  { value: IncomeType.PassiveIncome, label: 'Passive income', emoji: '🌱' },
  { value: IncomeType.Other, label: 'Other', emoji: '💰' },
];

export const MANDATORY_OPTIONS = [
  { value: MandatoryExpenseCategory.Rent, label: 'Rent', emoji: '🏠' },
  { value: MandatoryExpenseCategory.Utilities, label: 'Utilities', emoji: '💡' },
  { value: MandatoryExpenseCategory.Groceries, label: 'Groceries', emoji: '🛒' },
  { value: MandatoryExpenseCategory.Food, label: 'Food', emoji: '🍽️' },
  { value: MandatoryExpenseCategory.Insurance, label: 'Insurance', emoji: '🛡️' },
  { value: MandatoryExpenseCategory.Travel, label: 'Travel', emoji: '🚌' },
  { value: MandatoryExpenseCategory.Education, label: 'Education', emoji: '🎓' },
  { value: MandatoryExpenseCategory.Subscriptions, label: 'Subscriptions', emoji: '📺' },
  { value: MandatoryExpenseCategory.LoanEmi, label: 'Loan / EMI', emoji: '🏦' },
  { value: MandatoryExpenseCategory.Other, label: 'Other', emoji: '📦' },
];

export const ASSET_OPTIONS = [
  { value: AssetType.BankBalance, label: 'Bank balance', emoji: '🏦' },
  { value: AssetType.Cash, label: 'Cash', emoji: '💵' },
  { value: AssetType.Gold, label: 'Gold', emoji: '🥇' },
  { value: AssetType.Stocks, label: 'Stocks', emoji: '📈' },
  { value: AssetType.MutualFunds, label: 'Mutual funds', emoji: '📊' },
  { value: AssetType.Crypto, label: 'Crypto', emoji: '🪙' },
  { value: AssetType.Property, label: 'Property', emoji: '🏡' },
  { value: AssetType.Vehicle, label: 'Vehicle', emoji: '🚗' },
  { value: AssetType.BusinessAsset, label: 'Business asset', emoji: '🏭' },
  { value: AssetType.Other, label: 'Other', emoji: '📦' },
];

export const LIABILITY_OPTIONS = [
  { value: LiabilityType.PersonalLoan, label: 'Personal loan', emoji: '💳' },
  { value: LiabilityType.HomeLoan, label: 'Home loan', emoji: '🏠' },
  { value: LiabilityType.VehicleLoan, label: 'Vehicle loan', emoji: '🚗' },
  { value: LiabilityType.EducationLoan, label: 'Education loan', emoji: '🎓' },
  { value: LiabilityType.CreditCardDebt, label: 'Credit card', emoji: '💳' },
  { value: LiabilityType.BorrowedMoney, label: 'Borrowed money', emoji: '🤝' },
  { value: LiabilityType.Other, label: 'Other', emoji: '📦' },
];

/** Map an asset type to how quickly it converts to spendable cash. */
export const ASSET_LIQUIDITY: Record<string, LiquidityType> = {
  [AssetType.BankBalance]: LiquidityType.Liquid,
  [AssetType.Cash]: LiquidityType.Liquid,
  [AssetType.Stocks]: LiquidityType.SemiLiquid,
  [AssetType.MutualFunds]: LiquidityType.SemiLiquid,
  [AssetType.Gold]: LiquidityType.SemiLiquid,
  [AssetType.Crypto]: LiquidityType.SemiLiquid,
  [AssetType.Property]: LiquidityType.Illiquid,
  [AssetType.Vehicle]: LiquidityType.Illiquid,
  [AssetType.BusinessAsset]: LiquidityType.Illiquid,
  [AssetType.Other]: LiquidityType.SemiLiquid,
};
