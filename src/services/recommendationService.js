import {
  calculateCategoryBreakdown,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateSavingsRate,
  isSameMonthOffset,
  calculateTotalExpenses,
} from './calculationService';

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `rec-${Date.now()}-${idCounter}`;
}

function categoryLastMonth(transactions, category, ref = new Date()) {
  return calculateTotalExpenses(
    transactions,
    (t) => t.category === category && isSameMonthOffset(t.date, 1, ref)
  );
}

// Analyzes the user's full financial picture and returns structured,
// data-grounded recommendations. Never invents numbers not derived from userData.
export function generateFinancialRecommendations(userData) {
  const { transactions = [], budgets = [], goals = [], debts = [], subscriptions = [], profile = {} } = userData;
  const ref = new Date();
  const recommendations = [];

  const income = calculateMonthlyIncome(transactions, ref);
  const expenses = calculateMonthlyExpenses(transactions, ref);
  const savingsRate = calculateSavingsRate(income, expenses);
  const breakdown = calculateCategoryBreakdown(transactions, ref, 'expense');

  // Category month-over-month comparisons
  breakdown.forEach(({ category, amount }) => {
    const lastMonth = categoryLastMonth(transactions, category, ref);
    if (lastMonth > 0) {
      const changePercent = ((amount - lastMonth) / lastMonth) * 100;
      if (changePercent >= 20) {
        recommendations.push({
          id: nextId(),
          type: 'warning',
          title: `${category} spending is up`,
          message: `You've spent ${Math.round(changePercent)}% more on ${category} this month than last month.`,
          category,
          potentialSaving: Math.round(amount - lastMonth),
          priority: changePercent >= 40 ? 'high' : 'medium',
        });
      } else if (changePercent <= -15) {
        recommendations.push({
          id: nextId(),
          type: 'positive',
          title: `${category} spending is down`,
          message: `Nice — your ${category} spending dropped ${Math.abs(Math.round(changePercent))}% from last month.`,
          category,
          priority: 'low',
        });
      }
    }
  });

  // Budget adherence
  budgets.forEach((b) => {
    const spent = calculateTotalExpenses(transactions, (t) => t.category === b.category && isSameMonthOffset(t.date, 0, ref));
    const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    if (percentUsed >= 100) {
      recommendations.push({
        id: nextId(),
        type: 'warning',
        title: `${b.category} budget exceeded`,
        message: `You've gone over your ${b.category} budget by ${Math.round(spent - b.amount)}.`,
        category: b.category,
        priority: 'high',
      });
    } else if (percentUsed >= 85) {
      recommendations.push({
        id: nextId(),
        type: 'warning',
        title: `${b.category} budget almost reached`,
        message: `You've used ${Math.round(percentUsed)}% of your ${b.category} budget with days left in the month.`,
        category: b.category,
        priority: 'medium',
      });
    } else if (percentUsed > 0 && percentUsed < 60) {
      recommendations.push({
        id: nextId(),
        type: 'positive',
        title: `On track with ${b.category}`,
        message: `You're only at ${Math.round(percentUsed)}% of your ${b.category} budget this month.`,
        category: b.category,
        priority: 'low',
      });
    }
  });

  // Savings rate
  if (income > 0) {
    if (savingsRate < 10) {
      const targetRate = 15;
      const extraNeeded = Math.round((targetRate / 100) * income - (income - expenses));
      recommendations.push({
        id: nextId(),
        type: 'opportunity',
        title: 'Savings rate is low',
        message: `You're currently saving about ${Math.max(Math.round(savingsRate), 0)}% of your income. Finding an extra ${extraNeeded > 0 ? extraNeeded : 0} per month would bring you to a healthier 15%.`,
        potentialSaving: extraNeeded > 0 ? extraNeeded : 0,
        priority: 'medium',
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        id: nextId(),
        type: 'positive',
        title: 'Strong savings rate',
        message: `You're saving roughly ${Math.round(savingsRate)}% of your income this month — that's a healthy pace.`,
        priority: 'low',
      });
    }
  }

  // Goals
  goals.forEach((g) => {
    const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
    if (progress >= 100) {
      recommendations.push({
        id: nextId(),
        type: 'goal',
        title: `${g.name} goal reached`,
        message: `You hit your ${g.name} target. Consider setting a new goal or redirecting contributions to savings.`,
        priority: 'low',
      });
    } else if (progress > 0) {
      recommendations.push({
        id: nextId(),
        type: 'goal',
        title: `${g.name}: ${Math.round(progress)}% there`,
        message: `You're ${Math.round(progress)}% of the way to your ${g.name} goal of ${g.targetAmount}.`,
        priority: 'low',
      });
    }
  });

  // Debt
  if (debts.length > 0) {
    const highestInterest = [...debts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];
    if (highestInterest) {
      recommendations.push({
        id: nextId(),
        type: 'debt',
        title: `Focus extra payments on ${highestInterest.name}`,
        message: `${highestInterest.name} carries your highest interest rate at ${highestInterest.interestRate}%. Paying it down faster saves the most in interest overall.`,
        priority: 'medium',
      });
    }
  }

  // Subscriptions
  if (subscriptions.length >= 3) {
    const monthlyTotal = subscriptions.reduce((sum, s) => sum + Number(s.cost || 0), 0);
    recommendations.push({
      id: nextId(),
      type: 'opportunity',
      title: 'Review your subscriptions',
      message: `You have ${subscriptions.length} active subscriptions costing about ${Math.round(monthlyTotal)} per month combined. A quick review could free up cash for savings.`,
      potentialSaving: Math.round(monthlyTotal * 0.2),
      priority: 'low',
    });
  }

  // General / neutral fallback
  if (recommendations.length === 0) {
    recommendations.push({
      id: nextId(),
      type: 'general',
      title: 'Your spending looks stable',
      message: 'No unusual patterns detected this month. Keep tracking to unlock more personalized insights.',
      priority: 'low',
    });
  }

  const priorityWeight = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
}

export function generateDailyMessage(userData) {
  const { transactions = [] } = userData;
  const ref = new Date();
  const income = calculateMonthlyIncome(transactions, ref);
  const expenses = calculateMonthlyExpenses(transactions, ref);
  const dayOfMonth = ref.getDate();
  const avgDaily = dayOfMonth > 0 ? expenses / dayOfMonth : 0;
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - dayOfMonth;
  const remaining = Math.max(income - expenses, 0);
  const safeDaily = daysLeft > 0 ? remaining / daysLeft : remaining;

  if (income === 0 && expenses === 0) {
    return "Add your first transaction to start getting daily insights.";
  }

  return `You're averaging about ${Math.round(avgDaily)} per day in spending this month, with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. To stay on track, aim to keep today's spending under ${Math.round(safeDaily)}.`;
}
