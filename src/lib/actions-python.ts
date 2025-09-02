'use server';

import type { Answer } from './types';
import { getBackendUrl } from './config';

const BACKEND_URL = getBackendUrl();

export async function processVoiceExpense(audioDataUri: string): Promise<{ transcription?: string, parsedExpense?: any, error?: string }> {
  try {
    console.log('Calling Python backend for voice expense processing...');
    
    const response = await fetch(`${BACKEND_URL}/api/process-voice-expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data_uri: audioDataUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Python backend response:', result);
    // Normalize snake_case from backend to camelCase for frontend usage
    const parsedExpense = result.parsed_expense
      ? {
          amount: result.parsed_expense.amount,
          categoryName: result.parsed_expense.category_name,
          date: result.parsed_expense.date,
        }
      : undefined;

    return {
      transcription: result.transcription,
      parsedExpense,
      error: result.error,
    };
  } catch (error) {
    console.error('Error calling Python backend:', error);
    return { error: `Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function askAiAboutSpending(
  question: string,
  ym: string | undefined,
  transactions: Array<{ id: string; date: string; amount: number; categoryId: string; categoryName?: string; notes?: string }>,
  categories: Array<{ id: string; name: string }>
): Promise<{ data?: Answer; error?: string }> {
  try {
    console.log('Calling Python backend for spending analysis...');
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-spending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        year_month: ym,
        transactions: transactions,
        categories: categories
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Python backend spending analysis response:', result);
    
    return { 
      data: {
        answer: result.answer,
        explanation: result.explanation,
        sql: result.sql,
        preview: result.preview
      }
    };
  } catch (e) {
    console.error('Error calling Python backend for spending analysis:', e);
    return { error: "I couldn't answer that question. Please try rephrasing it." };
  }
}

export async function transcribeAudio(audioDataUri: string): Promise<{ text: string }> {
  try {
    console.log('Calling Python backend for transcription...');
    
    const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data_uri: audioDataUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Python backend transcription response:', result);
    
    return { text: result.text };
  } catch (error) {
    console.error('Error calling Python backend for transcription:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseExpenseFromText(text: string): Promise<{ amount: number; categoryName: string; date?: string }> {
  try {
    console.log('Calling Python backend for expense parsing...');
    
    const response = await fetch(`${BACKEND_URL}/api/parse-expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Python backend expense parsing response:', result);
    
    return {
      amount: result.amount,
      categoryName: result.category_name,
      date: result.date
    };
  } catch (error) {
    console.error('Error calling Python backend for expense parsing:', error);
    throw new Error(`Expense parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function revalidateDashboard() {
  // This function is kept for compatibility but doesn't need to do anything
  // since the Python backend doesn't use Next.js caching
  console.log('Dashboard revalidation called (no-op in Python backend mode)');
}

// Database operations
export async function createCategory(categoryData: {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error creating category:', error);
    return { error: `Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getCategories(): Promise<{ data?: any[]; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: `Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function updateCategory(
  categoryId: string, 
  updates: { name?: string; color?: string; icon?: string }
): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error updating category:', error);
    return { error: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function deleteCategory(categoryId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function createTransaction(transactionData: {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  notes?: string;
  date: string;
}): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { error: `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getTransactions(yearMonth?: string, limit?: number): Promise<{ data?: any[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (yearMonth) params.append('year_month', yearMonth);
    if (limit) params.append('limit', limit.toString());

    const url = `${BACKEND_URL}/api/transactions${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { error: `Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function updateTransaction(
  transactionId: string, 
  updates: { amount?: number; categoryId?: string; categoryName?: string; notes?: string; date?: string }
): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions/${transactionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { error: `Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function deleteTransaction(transactionId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/transactions/${transactionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { error: `Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function analyzeSpendingFromDB(
  question: string, 
  yearMonth?: string
): Promise<{ data?: Answer; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-spending-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        year_month: yearMonth
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { 
      data: {
        answer: result.answer,
        explanation: result.explanation,
        sql: result.sql,
        preview: result.preview
      }
    };
  } catch (error) {
    console.error('Error analyzing spending from database:', error);
    return { error: `Failed to analyze spending: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getMonthlySummary(yearMonth: string): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/monthly-summary/${yearMonth}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    return { error: `Failed to fetch monthly summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getAvailableMonths(): Promise<{ data?: string[]; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/available-months`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error fetching available months:', error);
    return { error: `Failed to fetch available months: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function exportData(): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/export-data`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { error: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function importData(data: any): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/import-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    console.error('Error importing data:', error);
    return { error: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
