export type IncomeSource =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'business'
  | 'gift'
  | 'refund'
  | 'other';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: IncomeSource;
  description: string | null;
  income_date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeInput {
  amount: number;
  source: IncomeSource;
  description?: string;
  income_date: string;
  is_recurring?: boolean;
}

export interface UpdateIncomeInput extends Partial<CreateIncomeInput> {
  id: string;
}

export const INCOME_SOURCE_CONFIG: Record<IncomeSource, { label: string; icon: string; color: string }> = {
  salary: { label: 'Salary', icon: 'Briefcase', color: 'bg-emerald-500' },
  freelance: { label: 'Freelance', icon: 'Laptop', color: 'bg-blue-500' },
  investment: { label: 'Investment', icon: 'TrendingUp', color: 'bg-purple-500' },
  business: { label: 'Business', icon: 'Building2', color: 'bg-indigo-500' },
  gift: { label: 'Gift', icon: 'Gift', color: 'bg-pink-500' },
  refund: { label: 'Refund', icon: 'RotateCcw', color: 'bg-teal-500' },
  other: { label: 'Other', icon: 'Wallet', color: 'bg-gray-500' },
};
