import { ExpenseCategory, PaymentMethod } from '@/types/expense';

export interface UPITransaction {
  id: string;
  amount: number;
  merchant: string;
  upiId: string;
  timestamp: Date;
  transactionId: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  isProcessed: boolean;
}

// Sample UPI transactions for demo
export const SAMPLE_UPI_TRANSACTIONS: Omit<UPITransaction, 'id' | 'isProcessed'>[] = [
  {
    amount: 299,
    merchant: 'Swiggy',
    upiId: 'swiggy@axisbank',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'food',
    paymentMethod: 'upi',
  },
  {
    amount: 150,
    merchant: 'Uber India',
    upiId: 'uber@icici',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'transport',
    paymentMethod: 'upi',
  },
  {
    amount: 499,
    merchant: 'Amazon Pay',
    upiId: 'amazonpay@apl',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'shopping',
    paymentMethod: 'upi',
  },
  {
    amount: 1200,
    merchant: 'Reliance Jio',
    upiId: 'jio@paytm',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'bills',
    paymentMethod: 'upi',
  },
  {
    amount: 799,
    merchant: 'Netflix India',
    upiId: 'netflix@ybl',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'entertainment',
    paymentMethod: 'upi',
  },
  {
    amount: 350,
    merchant: 'Apollo Pharmacy',
    upiId: 'apollo@hdfcbank',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    category: 'health',
    paymentMethod: 'upi',
  },
];

// Function to generate fresh sample transactions
export function generateSampleTransactions(): UPITransaction[] {
  return SAMPLE_UPI_TRANSACTIONS.map((tx, index) => ({
    ...tx,
    id: `demo-${index}-${Date.now()}`,
    transactionId: 'UPI' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    timestamp: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * (index + 1)),
    isProcessed: false,
  }));
}

// Merchant to category mapping for auto-categorization
export const MERCHANT_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  swiggy: 'food',
  zomato: 'food',
  'uber eats': 'food',
  dominos: 'food',
  mcdonalds: 'food',
  starbucks: 'food',
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  'indian railways': 'transport',
  irctc: 'travel',
  makemytrip: 'travel',
  goibibo: 'travel',
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  ajio: 'shopping',
  netflix: 'entertainment',
  hotstar: 'entertainment',
  spotify: 'entertainment',
  'bookmyshow': 'entertainment',
  jio: 'bills',
  airtel: 'bills',
  'electricity': 'bills',
  'water': 'bills',
  apollo: 'health',
  '1mg': 'health',
  pharmeasy: 'health',
  byju: 'education',
  unacademy: 'education',
  coursera: 'education',
};

// Parse merchant name to detect category
export function detectCategoryFromMerchant(merchant: string): ExpenseCategory {
  const normalizedMerchant = merchant.toLowerCase();
  
  for (const [keyword, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalizedMerchant.includes(keyword)) {
      return category;
    }
  }
  
  return 'other';
}
