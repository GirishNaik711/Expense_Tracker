'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, LoaderCircle, Send, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { askAiAboutSpending } from '@/lib/actions-python';
import type { Answer } from '@/lib/types';
import { useStore } from '@/lib/store';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const askSchema = z.object({
  question: z.string().min(1, 'Please ask a question.'),
});

interface Conversation {
  role: 'user' | 'ai';
  content: string | Answer;
}

export default function AskAiPage() {
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentMonth, transactions, categories } = useStore();

  const form = useForm<z.infer<typeof askSchema>>({
    resolver: zodResolver(askSchema),
    defaultValues: { question: '' },
  });

  const onSubmit = async (values: z.infer<typeof askSchema>) => {
    setIsLoading(true);
    setConversation((prev) => [...prev, { role: 'user', content: values.question }]);
    form.reset();

    const ym = format(currentMonth, 'yyyy-MM');

    // Prepare month-filtered transactions and attach category names for better reasoning
    const monthTxns = transactions
      .filter((t) => format(new Date(t.date), 'yyyy-MM') === ym)
      .map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        categoryId: t.categoryId,
        categoryName: categories.find((c) => c.id === t.categoryId)?.name,
        notes: t.notes,
      }));

    const minimalCategories = categories.map((c) => ({ id: c.id, name: c.name }));

    // Debug: Log the data being sent to AI
    console.log('Data being sent to AI:', {
      question: values.question,
      ym,
      transactions: monthTxns,
      categories: minimalCategories
    });
    
    const result = await askAiAboutSpending(values.question, ym, monthTxns, minimalCategories);
    
    if (result.data) {
        setConversation((prev) => [...prev, { role: 'ai', content: result.data as Answer }]);
    } else {
        setConversation((prev) => [...prev, { role: 'ai', content: { answer: result.error || 'An unknown error occurred.', explanation: '' } }]);
    }

    setIsLoading(false);
  };
  
  const suggestedQuestions = [
    "What's my total spending this month?",
    "Which category did I spend the most on?",
    "Show my largest transaction.",
  ];

  return (
    <main className="flex flex-col flex-1 h-screen">
      <header className="p-4 md:p-6 border-b bg-card">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Ask AI</h1>
        <p className="text-muted-foreground">Get insights on your spending for {format(currentMonth, 'MMMM yyyy')}</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {conversation.length === 0 && (
            <Card className="bg-transparent border-dashed">
                <CardHeader>
                    <CardTitle>Welcome to AI Insights!</CardTitle>
                    <CardDescription>Ask questions about your spending habits. Try one of these:</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-2">
                    {suggestedQuestions.map(q => (
                        <Button key={q} variant="outline" onClick={() => form.setValue('question', q)}>{q}</Button>
                    ))}
                </CardContent>
            </Card>
        )}
        {conversation.map((entry, index) => (
          <div key={index} className={`flex items-start gap-4 ${entry.role === 'user' ? 'justify-end' : ''}`}>
            {entry.role === 'ai' && <div className="p-2 bg-primary rounded-full text-primary-foreground"><Bot className="h-6 w-6" /></div>}
            
            <div className={`max-w-xl rounded-lg p-4 ${entry.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                {typeof entry.content === 'string' ? <p>{entry.content}</p> : <AiResponse response={entry.content} />}
            </div>

            {entry.role === 'user' && <div className="p-2 bg-muted rounded-full text-muted-foreground"><User className="h-6 w-6" /></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary rounded-full text-primary-foreground"><Bot className="h-6 w-6" /></div>
                <div className="max-w-xl rounded-lg p-4 bg-card flex items-center gap-2">
                    <LoaderCircle className="animate-spin h-5 w-5" /> Thinking...
                </div>
            </div>
        )}
      </div>

      <div className="p-4 md:p-6 border-t bg-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="e.g., How much did I spend on groceries?" {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}

const AiResponse = ({ response }: { response: Answer }) => {
    return (
        <div>
            <p className="font-bold text-lg">{response.answer}</p>
            <p className="text-sm text-muted-foreground mt-2">{response.explanation}</p>
            {Array.isArray(response.preview) && response.preview.length > 0 && (
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Object.keys(response.preview[0]).map((key) => (
                                    <TableHead key={key}>{key}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {response.preview.map((row, i) => (
                                <TableRow key={i}>
                                    {Object.values(row).map((val, j) => (
                                        <TableCell key={j}>
                                            {typeof val === 'number'
                                                ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)
                                                : String(val)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            {typeof response.preview === 'string' && response.preview && (
                <div className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {response.preview}
                </div>
            )}
            {response.sql && (
                <details className="mt-4">
                    <summary className="text-xs cursor-pointer text-muted-foreground">Show SQL query</summary>
                    <pre className="mt-2 bg-muted p-2 rounded-md text-xs font-code overflow-x-auto">
                        <code>{response.sql}</code>
                    </pre>
                </details>
            )}
        </div>
    )
}
