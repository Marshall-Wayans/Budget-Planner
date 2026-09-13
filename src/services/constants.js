export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Rent', 'Utilities', 'Internet', 'Phone',
  'Shopping', 'Entertainment', 'Education', 'Healthcare', 'Insurance',
  'Debt', 'Savings', 'Investments', 'Family', 'Personal', 'Other',
];

export const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Business', 'Investments', 'Side hustle', 'Gift', 'Other',
];

export const INCOME_FREQUENCIES = [
  'One-time', 'Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Yearly',
];

export const PAYMENT_METHODS = [
  'Cash', 'M-Pesa', 'Bank', 'Debit Card', 'Credit Card', 'Mobile Money', 'Other',
];

export const GOAL_TEMPLATES = [
  'Emergency Fund', 'New Phone', 'Laptop', 'Car', 'House', 'Vacation', 'Education', 'Business', 'Custom Goal',
];

export const CATEGORY_COLORS = {
  Food: '#2F8258', Transport: '#C9A24B', Housing: '#5B7FA6', Rent: '#5B7FA6',
  Utilities: '#7FB894', Internet: '#8B7FD1', Phone: '#8B7FD1', Shopping: '#D2604A',
  Entertainment: '#D9B25D', Education: '#4B9BB0', Healthcare: '#D2604A',
  Insurance: '#5B7FA6', Debt: '#B14C39', Savings: '#236B47', Investments: '#1B5538',
  Family: '#C9885E', Personal: '#9A8C78', Other: '#8C8C8C',
};

export function colorForCategory(category) {
  return CATEGORY_COLORS[category] || '#8C8C8C';
}
