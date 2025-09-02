import { create } from 'zustand';
import {
  format,
  startOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { Category, Transaction } from './types';
import { PiggyBank } from 'lucide-react';



interface AppState {
  categories: Category[];
  transactions: Transaction[];
  currentMonth: Date;
  addExpenseSheetOpen: boolean;
  setAddExpenseSheetOpen: (open: boolean, transaction?: Partial<Transaction>) => void;
  editingTransaction: Partial<Transaction> | null;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'year' | 'month'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'isArchived' | 'icon'> & {icon?: any}) => Category;
  deleteCategory: (id: string) => void;
  getCategoryByName: (name?: string | null) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
  setCurrentMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  categories: [],
  transactions: [],
  currentMonth: startOfMonth(new Date()),
  addExpenseSheetOpen: false,
  editingTransaction: null,
  setAddExpenseSheetOpen: (open, transaction) => set({ addExpenseSheetOpen: open, editingTransaction: transaction || null }),
  addTransaction: (transaction) =>
    set((state) => {
      const newTxn: Transaction = {
        ...transaction,
        id: `txn-${Date.now()}`,
        date: transaction.date || format(new Date(), 'yyyy-MM-dd'),
        year: new Date(transaction.date || new Date()).getFullYear(),
        month: new Date(transaction.date || new Date()).getMonth() + 1,
        createdAt: new Date().toISOString(),
      };
      return { transactions: [...state.transactions, newTxn] };
    }),
  updateTransaction: (id, updatedTxn) => set(state => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, ...updatedTxn } : t)
  })),
  deleteTransaction: (id) => set(state => ({
    transactions: state.transactions.filter(t => t.id !== id)
  })),
  addCategory: (category) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      isArchived: false,
      createdAt: new Date().toISOString(),
      icon: category.icon || PiggyBank
    };
    set((state) => ({ categories: [...state.categories, newCategory] }));
    return newCategory;
  },
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id),
    transactions: state.transactions.filter(t => t.categoryId !== id)
  })),
  getCategoryByName: (name) => {
    if (!name) return undefined;
    const lowerCaseName = String(name).toLowerCase();
    return get().categories.find(c => c.name.toLowerCase() === lowerCaseName);
  },
  getCategoryById: (id) => get().categories.find(c => c.id === id),
  setCurrentMonth: (date) => set({ currentMonth: startOfMonth(date) }),
  nextMonth: () => set((state) => ({ currentMonth: addMonths(state.currentMonth, 1) })),
  prevMonth: () => set((state) => ({ currentMonth: subMonths(state.currentMonth, 1) })),
}));
