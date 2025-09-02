'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';

export function MonthPicker() {
  const { currentMonth, prevMonth, nextMonth } = useStore();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      <span className="text-sm font-medium w-32 text-center">
        {format(currentMonth, 'MMMM yyyy')}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );
}
