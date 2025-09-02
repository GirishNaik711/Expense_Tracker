'use client';

import { useMemo } from 'react';
import { format, isSameMonth } from 'date-fns';
import { ArrowDownUp, IndianRupee, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { MonthPicker } from '@/components/month-picker';
import { VoiceRecorder } from '@/components/voice-recorder';
import { Button } from '@/components/ui/button';

// ---- TZ-SAFE HELPERS ----
// Convert 'YYYY-MM-DD' to a UTC Date to avoid day rollovers across timezones.
// For full ISO strings with timezones, fallback to native parsing.
function toUTCDate(d: string | Date): Date {
  if (d instanceof Date) return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day));
  }
  return new Date(d); // assumes ISO with TZ info
}

export default function DashboardPage() {
  const { transactions, categories, currentMonth, setAddExpenseSheetOpen } = useStore();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => isSameMonth(toUTCDate(t.date), currentMonth));
  }, [transactions, currentMonth]);

  const summary = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    });

    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? categories.find((c) => c.id === topCategoryEntry[0]) : null;

    return {
      total,
      transactionCount: filteredTransactions.length,
      topCategory: topCategory ? topCategory.name : 'N/A',
    };
  }, [filteredTransactions, categories]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <main className="flex flex-col flex-1 bg-background p-4 md:p-6 pb-20 md:pb-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Dashboard</h1>
        <div className="flex items-center gap-2">
          <VoiceRecorder />
          <MonthPicker />
        </div>
      </header>

      <div className="md:hidden flex items-center justify-center mb-4">
        <MonthPicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
            <p className="text-xs text-muted-foreground">
              in {format(currentMonth, 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total transactions this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.topCategory}</div>
            <p className="text-xs text-muted-foreground">Highest spending category</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold font-headline mb-4">Recent Transactions</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {filteredTransactions.slice(0, 5).map((t) => {
                const category = categories.find((c) => c.id === t.categoryId);
                const displayDate = format(toUTCDate(t.date), 'MMM dd'); // <- stable
                return (
                  <li key={t.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {category && (
                        <category.icon
                          className="h-8 w-8 p-1.5 rounded-full"
                          style={{ backgroundColor: category.color + '33', color: category.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{category?.name || 'Uncategorized'}</p>
                        <p className="text-sm text-muted-foreground">{t.notes || 'No notes'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(t.amount)}</p>
                      {/* Ignore hydration diff just in case some data arrives late */}
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {displayDate}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {filteredTransactions.length === 0 && (
              <p className="text-center p-8 text-muted-foreground">No transactions this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
