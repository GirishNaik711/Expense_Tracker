'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  MessagesSquare,
  Shapes,
  Plus,
  Mic,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { AddExpenseSheet } from '@/components/add-expense-sheet';
import { VoiceRecorder } from '@/components/voice-recorder';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Wallet },
  { href: '/ask', label: 'Ask AI', icon: MessagesSquare },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setAddExpenseSheetOpen = useStore((s) => s.setAddExpenseSheetOpen);

  return (
    <div className="min-h-screen w-full flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-headline">ExpenseAI</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto">
          <Button className="w-full" onClick={() => setAddExpenseSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around items-center p-2 z-10">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-md ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Floating Action Buttons */}
      <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-3">
        <VoiceRecorder />
        <Button size="icon" className="rounded-full h-14 w-14 shadow-lg" onClick={() => setAddExpenseSheetOpen(true)}>
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add Expense</span>
        </Button>
      </div>

      <AddExpenseSheet />
    </div>
  );
}
