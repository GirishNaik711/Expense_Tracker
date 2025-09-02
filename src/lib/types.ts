import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: LucideIcon;
  isArchived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  year: number;
  month: number;
  categoryId: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface Answer {
  answer: string;
  explanation: string;

  sql?: string;
  // Can be a tabular preview (array of records) or a simple textual summary
  preview?: Record<string, any>[] | string;
}
