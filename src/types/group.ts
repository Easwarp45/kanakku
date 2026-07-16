import { ExpenseCategory } from './expense';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  nickname: string | null;
  created_at?: string;
  is_admin?: boolean;
  profile?: {
    user_id?: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  expense_date: string;
  split_type: 'equal' | 'custom';
  created_at: string;
  updated_at: string;
  paid_by_profile?: {
    display_name: string | null;
  };
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  group_expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
}

export interface Settlement {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  note: string | null;
  settled_at: string;
}

export interface GroupChat {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface CreateGroupExpenseInput {
  group_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  expense_date: string;
  split_type: 'equal' | 'custom';
  splits: { user_id: string; amount: number }[];
}

export interface UpdateGroupExpenseInput {
  expense_id: string;
  group_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  expense_date: string;
  split_type: 'equal' | 'custom';
  splits: { user_id: string; amount: number }[];
}

export interface MemberBalance {
  user_id: string;
  display_name: string;
  balance: number; // positive = owed to them, negative = they owe
}

export interface SimplifiedDebt {
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_name: string;
  amount: number;
}
