export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'education'
  | 'travel'
  | 'other';

export type PaymentMethod =
  | 'upi'
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  payment_method: PaymentMethod;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  payment_method: PaymentMethod;
  expense_date: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string;
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'Food & Dining', icon: 'UtensilsCrossed', color: 'bg-orange-500' },
  transport: { label: 'Transport', icon: 'Car', color: 'bg-blue-500' },
  entertainment: { label: 'Entertainment', icon: 'Film', color: 'bg-purple-500' },
  shopping: { label: 'Shopping', icon: 'ShoppingBag', color: 'bg-pink-500' },
  bills: { label: 'Bills & Utilities', icon: 'Receipt', color: 'bg-yellow-500' },
  health: { label: 'Health', icon: 'Heart', color: 'bg-red-500' },
  education: { label: 'Education', icon: 'GraduationCap', color: 'bg-indigo-500' },
  travel: { label: 'Travel', icon: 'Plane', color: 'bg-teal-500' },
  other: { label: 'Other', icon: 'MoreHorizontal', color: 'bg-gray-500' },
};

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string }> = {
  upi: { label: 'UPI', icon: 'Smartphone' },
  cash: { label: 'Cash', icon: 'Banknote' },
  card: { label: 'Card', icon: 'CreditCard' },
  bank_transfer: { label: 'Bank Transfer', icon: 'Building2' },
  other: { label: 'Other', icon: 'Wallet' },
};
