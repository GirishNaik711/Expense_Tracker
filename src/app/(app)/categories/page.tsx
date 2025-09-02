'use client';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { CreateCategoryDialog } from '@/components/create-category-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CategoriesPage() {
  const { categories, deleteCategory } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <main className="flex flex-col flex-1 bg-background p-4 md:p-6 pb-20 md:pb-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Categories</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <Card key={category.id} className="relative overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: category.color + '33' }}>
                    <category.icon className="h-6 w-6" style={{ color: category.color }} />
                </div>
                <div>
                    <p className="font-semibold text-lg">{category.name}</p>
                    <p className={`text-sm ${category.isArchived ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {category.isArchived ? 'Archived' : 'Active'}
                    </p>
                </div>
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDeleteId(category.id)}
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
            </CardContent>
            <div className="h-1 absolute bottom-0 left-0 right-0" style={{backgroundColor: category.color}}></div>
          </Card>
        ))}
      </div>
      <CreateCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category and any transactions assigned to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) {
                  const category = categories.find(c => c.id === pendingDeleteId);
                  deleteCategory(pendingDeleteId);
                  toast({ title: 'Category deleted', description: category ? `${category.name} removed.` : 'Removed.' });
                }
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
