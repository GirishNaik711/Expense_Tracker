'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Please select a valid color'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const { addCategory } = useStore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    addCategory(data);
    toast({ title: 'Success', description: 'Category created successfully.' });
    onOpenChange(false);
    form.reset({
        name: '',
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset({
            name: '',
            color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="create-category-form" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="w-12 h-10 p-1" />
                      <Input type="text" {...field} placeholder="#RRGGBB" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="create-category-form">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
