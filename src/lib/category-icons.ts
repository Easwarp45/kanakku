import {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  Heart,
  BookOpen,
  Plane,
  HelpCircle,
  Wallet,
  TrendingUp,
  Gift,
  LucideIcon,
} from 'lucide-react';
import type { ExpenseCategory } from '@/types/expense';

// Map category names to Lucide icons
export const CATEGORY_ICONS: Record<ExpenseCategory | 'income', LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Film,
  shopping: ShoppingBag,
  bills: Receipt,
  health: Heart,
  education: BookOpen,
  travel: Plane,
  other: HelpCircle,
  income: TrendingUp,
};

// Alternative icons for income sources
export const INCOME_SOURCE_ICONS: Record<string, LucideIcon> = {
  salary: TrendingUp,
  freelance: Wallet,
  investment: TrendingUp,
  bonus: Gift,
  other: HelpCircle,
};

export function getCategoryIcon(category: ExpenseCategory | 'income'): LucideIcon {
  return CATEGORY_ICONS[category] || HelpCircle;
}

export function getIncomeSourceIcon(source: string): LucideIcon {
  return INCOME_SOURCE_ICONS[source.toLowerCase()] || HelpCircle;
}
