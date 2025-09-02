'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect } from 'react';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const expenseFormSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Please select a category'),
  date: z.date(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function AddExpenseSheet() {
  const {
    addExpenseSheetOpen,
    setAddExpenseSheetOpen,
    editingTransaction,
    categories,
    addTransaction,
    updateTransaction,
  } = useStore();
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: 0,
      categoryId: '',
      date: new Date(),
      notes: '',
    },
  });

  useEffect(() => {
    if (editingTransaction) {
      form.reset({
        amount: editingTransaction.amount || 0,
        categoryId: editingTransaction.categoryId || '',
        date: editingTransaction.date ? parseISO(editingTransaction.date) : new Date(),
        notes: editingTransaction.notes || '',
      });
    } else {
      form.reset({
        amount: 0,
        categoryId: '',
        date: new Date(),
        notes: '',
      });
    }
  }, [editingTransaction, form]);

  const onSubmit = (data: ExpenseFormValues) => {
    const transactionData = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
    };
    if (editingTransaction?.id) {
        updateTransaction(editingTransaction.id, transactionData);
        toast({ title: "Success", description: "Expense updated successfully." });
    } else {
        addTransaction(transactionData);
        toast({ title: "Success", description: "Expense added successfully." });
    }
    setAddExpenseSheetOpen(false);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    setAddExpenseSheetOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Sheet open={addExpenseSheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{editingTransaction ? 'Edit Expense' : 'Add Expense'}</SheetTitle>
          <SheetDescription>
            {editingTransaction ? 'Update the details of your expense.' : 'Enter the details of your new expense.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.filter(c => !c.isArchived).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Weekly groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="mt-auto pt-4">
            <Button type="submit" form="add-expense-form" className="w-full" onClick={form.handleSubmit(onSubmit)}>
              {editingTransaction ? 'Save Changes' : 'Add Expense'}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
