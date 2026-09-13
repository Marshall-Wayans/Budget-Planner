const DAY_MS = 1000 * 60 * 60 * 24;

export function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function isSameMonth(dateStr, ref = new Date()) {
  const d = toDate(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function isSameMonthOffset(dateStr, monthsAgo, ref = new Date()) {
  const target = new Date(ref.getFullYear(), ref.getMonth() - monthsAgo, 1);
  const d = toDate(dateStr);
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
}

export function daysRemainingInMonth(ref = new Date()) {
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return Math.max(lastDay - ref.getDate() + 1, 1);
}

export function daysElapsedInMonth(ref = new Date()) {
  return ref.getDate();
}

// ---------- Core aggregates ----------

export function calculateTotalIncome(transactions, filterFn = () => true) {
  return transactions
    .filter((t) => t.type === 'income' && filterFn(t))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function calculateTotalExpenses(transactions, filterFn = () => true) {
  return transactions
    .filter((t) => t.type === 'expense' && filterFn(t))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function calculateBalance(transactions) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  return income - expenses;
}

export function calculateMonthlyIncome(transactions, ref = new Date()) {
  return calculateTotalIncome(transactions, (t) => isSameMonth(t.date, ref));
}

export function calculateMonthlyExpenses(transactions, ref = new Date()) {
  return calculateTotalExpenses(transactions, (t) => isSameMonth(t.date, ref));
}

export function calculateCategoryBreakdown(transactions, ref = new Date(), type = 'expense') {
  const monthTx = transactions.filter((t) => t.type === type && isSameMonth(t.date, ref));
  const total = monthTx.reduce((s, t) => s + Number(t.amount || 0), 0);
  const byCategory = {};
  monthTx.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0);
  });
  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateMonthlySeries(transactions, monthsBack = 6, ref = new Date()) {
  const series = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const income = calculateTotalIncome(transactions, (t) => isSameMonthOffset(t.date, i, ref));
    const expenses = calculateTotalExpenses(transactions, (t) => isSameMonthOffset(t.date, i, ref));
    series.push({ month: label, income, expenses, net: income - expenses });
  }
  return series;
}

// ---------- Savings & goals ----------

export function calculateSavingsRate(income, expenses) {
  if (income <= 0) return 0;
  const saved = income - expenses;
  return Math.max(Math.min((saved / income) * 100, 100), -100);
}

export function calculateGoalProgress(goal) {
  const target = Number(goal.targetAmount || 0);
  const current = Number(goal.currentAmount || 0);
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);
  const monthly = Number(goal.monthlyContribution || 0);
  const monthsRequired = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  let estimatedDate = null;
  if (monthsRequired !== null) {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsRequired);
    estimatedDate = d;
  }
  return { progress, remaining, monthsRequired, estimatedDate };
}

export function calculateRequiredMonthlyContribution(targetAmount, currentAmount, months) {
  const remaining = Math.max(Number(targetAmount) - Number(currentAmount), 0);
  if (months <= 0) return remaining;
  return remaining / months;
}

// ---------- Debt ----------

export function calculateDebtRatio(totalDebtPayments, income) {
  if (income <= 0) return 0;
  return (totalDebtPayments / income) * 100;
}

// Amortizes a debt with a monthly payment (minimum + extra) against a monthly interest rate.
export function calculateDebtPayoff(principal, annualRatePercent, monthlyPayment) {
  const monthlyRate = (Number(annualRatePercent) || 0) / 100 / 12;
  let balance = Number(principal) || 0;
  const payment = Number(monthlyPayment) || 0;

  if (payment <= 0) {
    return { months: null, totalInterest: null, payoffPossible: false };
  }
  // If payment doesn't cover interest, it will never pay off.
  if (monthlyRate > 0 && payment <= balance * monthlyRate) {
    return { months: null, totalInterest: null, payoffPossible: false };
  }

  let months = 0;
  let totalInterest = 0;
  const MAX_MONTHS = 600; // 50 years safety cap

  while (balance > 0 && months < MAX_MONTHS) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    const principalPaid = Math.min(payment - interest, balance);
    balance -= principalPaid;
    months += 1;
  }

  return { months, totalInterest, payoffPossible: true };
}

export function compareDebtStrategies(principal, annualRatePercent, minPayment, extraPayment) {
  const minimum = calculateDebtPayoff(principal, annualRatePercent, minPayment);
  const aggressive = calculateDebtPayoff(principal, annualRatePercent, minPayment + extraPayment);
  const monthsSaved =
    minimum.payoffPossible && aggressive.payoffPossible
      ? minimum.months - aggressive.months
      : null;
  const interestSaved =
    minimum.payoffPossible && aggressive.payoffPossible
      ? minimum.totalInterest - aggressive.totalInterest
      : null;
  return { minimum, aggressive, monthsSaved, interestSaved };
}

// ---------- Spending limits & budgets ----------

export function calculateAvailableToSpend({ income, essentialExpenses, debtPayments, savingsTarget }) {
  return Math.max(
    Number(income || 0) - Number(essentialExpenses || 0) - Number(debtPayments || 0) - Number(savingsTarget || 0),
    0
  );
}

export function calculateDailySpendingLimit(availableToSpend, daysRemaining = daysRemainingInMonth()) {
  if (daysRemaining <= 0) return availableToSpend;
  return availableToSpend / daysRemaining;
}

export function calculateSafeToSpend({ balance, upcomingBills, essentialExpensesRemaining, savingsTarget, daysRemaining }) {
  const monthlyAvailable = Math.max(
    Number(balance || 0) - Number(upcomingBills || 0) - Number(essentialExpensesRemaining || 0) - Number(savingsTarget || 0),
    0
  );
  const days = daysRemaining ?? daysRemainingInMonth();
  const daily = days > 0 ? monthlyAvailable / days : monthlyAvailable;
  return {
    monthly: monthlyAvailable,
    weekly: daily * 7,
    daily,
  };
}

export function calculateMonthlyBudgetSummary(inputs) {
  const {
    income = 0,
    housing = 0,
    food = 0,
    transport = 0,
    utilities = 0,
    debt = 0,
    entertainment = 0,
    savings = 0,
    other = 0,
  } = inputs;
  const totalExpenses = housing + food + transport + utilities + debt + entertainment + other;
  const remaining = income - totalExpenses - savings;
  const savingsPercent = income > 0 ? (savings / income) * 100 : 0;
  const spendingPercent = income > 0 ? (totalExpenses / income) * 100 : 0;
  const disposableIncome = income - totalExpenses;

  return {
    totalExpenses,
    totalSavings: savings,
    remaining,
    savingsPercent,
    spendingPercent,
    disposableIncome,
  };
}

// Allocates income across needs / wants / savings / debt / emergency fund,
// weighted by the user's actual expense mix rather than a fixed 50/30/20 split.
export function calculateSmartSplit({ income, essentialTotal, wantsTotal, debtTotal, existingSavingsRate }) {
  if (income <= 0) {
    return { needs: 0, wants: 0, savings: 0, debt: 0, emergency: 0 };
  }
  const knownSpend = essentialTotal + wantsTotal + debtTotal;
  const leftover = Math.max(income - knownSpend, 0);

  // Baseline: honor known essentials and debt obligations first.
  let needs = Math.min(essentialTotal, income);
  let debt = Math.min(debtTotal, Math.max(income - needs, 0));
  let remainingAfterFixed = Math.max(income - needs - debt, 0);

  // Target savings rate nudges upward from whatever the user is already doing,
  // capped so it never crowds out all discretionary spending.
  const baselineRate = Math.max(existingSavingsRate || 0, 10);
  const targetSavingsRate = Math.min(baselineRate + 2, 30);
  let savings = Math.min((targetSavingsRate / 100) * income, remainingAfterFixed);

  let emergency = Math.min(remainingAfterFixed * 0.1, remainingAfterFixed - savings);
  emergency = Math.max(emergency, 0);

  let wants = Math.max(remainingAfterFixed - savings - emergency, 0);
  // If the user has real "wants" spending history, respect it as a floor when there's room.
  if (wantsTotal > 0 && wantsTotal <= remainingAfterFixed) {
    wants = Math.max(wants, Math.min(wantsTotal, remainingAfterFixed - savings - emergency));
  }

  return {
    needs: Math.round(needs),
    wants: Math.round(wants),
    savings: Math.round(savings),
    debt: Math.round(debt),
    emergency: Math.round(emergency),
    leftoverUnallocated: Math.round(Math.max(leftover - wants, 0)),
  };
}

// ---------- Affordability ----------

export function calculateAffordability({ itemPrice, currentBalance, monthlyIncome, monthlyExpenses, monthlySavingsTarget }) {
  const price = Number(itemPrice) || 0;
  const balance = Number(currentBalance) || 0;
  const disposableAfterExpenses = Math.max(Number(monthlyIncome || 0) - Number(monthlyExpenses || 0), 0);
  const remainingAfterPurchase = balance - price;
  const canAfford = remainingAfterPurchase >= (Number(monthlySavingsTarget) || 0);
  const impactOnSavings = Math.min(price, Number(monthlySavingsTarget) || 0);
  const percentOfAvailable = disposableAfterExpenses > 0 ? (price / disposableAfterExpenses) * 100 : price > 0 ? 100 : 0;
  const recommendedLimit = Math.max(disposableAfterExpenses - (Number(monthlySavingsTarget) || 0), 0);

  return {
    canAfford,
    remainingAfterPurchase,
    impactOnSavings,
    percentOfAvailable,
    recommendedLimit,
  };
}

// ---------- Financial health score ----------

export function calculateFinancialHealthScore({
  savingsRate,
  debtRatio,
  emergencyFundMonths,
  budgetAdherencePercent,
  goalProgressPercent,
}) {
  // Each factor scored 0-100, then weighted.
  const savingsScore = Math.max(Math.min(savingsRate * 4, 100), 0); // 25% savings rate -> 100
  const debtScore = Math.max(100 - debtRatio * 2, 0); // 0% debt ratio -> 100, 50%+ -> 0
  const emergencyScore = Math.max(Math.min((emergencyFundMonths / 6) * 100, 100), 0);
  const budgetScore = Math.max(Math.min(budgetAdherencePercent, 100), 0);
  const goalScore = Math.max(Math.min(goalProgressPercent, 100), 0);

  const weighted =
    savingsScore * 0.3 + debtScore * 0.25 + emergencyScore * 0.2 + budgetScore * 0.15 + goalScore * 0.1;

  const score = Math.round(Math.max(Math.min(weighted, 100), 0));

  let label = 'Needs attention';
  if (score >= 80) label = 'Excellent';
  else if (score >= 65) label = 'Good';
  else if (score >= 45) label = 'Fair';

  return { score, label, breakdown: { savingsScore, debtScore, emergencyScore, budgetScore, goalScore } };
}

// ---------- What-if simulator ----------

export function calculateWhatIfScenario({ currentMonthlySavings, change, months = 12 }) {
  const newMonthlySavings = currentMonthlySavings + change;
  const currentProjection = currentMonthlySavings * months;
  const newProjection = newMonthlySavings * months;
  return {
    currentProjection,
    newProjection,
    difference: newProjection - currentProjection,
    newMonthlySavings,
  };
}

// ---------- Subscriptions ----------

export function calculateSubscriptionTotals(subscriptions) {
  const monthly = subscriptions.reduce((sum, s) => {
    const cost = Number(s.cost || 0);
    if (s.frequency === 'yearly') return sum + cost / 12;
    if (s.frequency === 'weekly') return sum + cost * 4.33;
    return sum + cost;
  }, 0);
  return { monthly, yearly: monthly * 12 };
}

export function daysUntil(dateStr) {
  const target = toDate(dateStr);
  const now = new Date();
  return Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / DAY_MS);
}
