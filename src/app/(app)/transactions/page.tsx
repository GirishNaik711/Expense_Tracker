'use client';

import { useMemo } from 'react';
import { format, isSameMonth } from 'date-fns';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { useStore } from '@/lib/store';
import { MonthPicker } from '@/components/month-picker';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function TransactionsPage() {
  const { transactions, categories, currentMonth, deleteTransaction, setAddExpenseSheetOpen } = useStore();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => isSameMonth(new Date(t.date), currentMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <main className="flex flex-col flex-1 bg-background p-4 md:p-6 pb-20 md:pb-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Transactions</h1>
        <div className="hidden md:flex">
            <MonthPicker />
        </div>
      </header>

      <div className="md:hidden flex items-center justify-center mb-4">
        <MonthPicker />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => {
                const category = categories.find((c) => c.id === t.categoryId);
                return (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.date), 'PPP')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {category && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category?.name || 'Uncategorized'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>
                    <TableCell>{t.notes}</TableCell>
                    <TableCell className="text-right">
                       <TransactionActions transaction={t} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredTransactions.length === 0 && (
            <p className="text-center p-8 text-muted-foreground">No transactions this month.</p>
          )}
        </Card>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.map((t) => {
          const category = categories.find((c) => c.id === t.categoryId);
          return (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {category && <category.icon className="h-10 w-10 p-2 rounded-lg" style={{backgroundColor: category.color + '33', color: category.color}} />}
                  <div>
                    <p className="font-semibold">{category?.name || 'Uncategorized'}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                    {t.notes && <p className="text-sm text-muted-foreground mt-1">{t.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-bold text-lg">{formatCurrency(t.amount)}</p>
                  <TransactionActions transaction={t} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredTransactions.length === 0 && (
          <p className="text-center pt-16 text-muted-foreground">No transactions this month.</p>
        )}
      </div>
    </main>
  );
}

function TransactionActions({ transaction }: { transaction: any }) {
    const { deleteTransaction, setAddExpenseSheetOpen } = useStore();
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setAddExpenseSheetOpen(true, transaction)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this transaction.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTransaction(transaction.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
