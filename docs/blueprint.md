# **App Name**: ExpenseAI

## Core Features:

- Voice Transcription: Transcribe audio input using OpenAI Whisper to convert speech to text for expense entry.
- Intelligent Parsing: Parse transcribed text with GPT-4.1/5 tool to extract expense amount, category, and date.
- AI-Powered Insights: Provide insights and answer questions about spending patterns using LLM-powered analysis on the stored transaction data.
- Data Visualization: Display monthly expense data in a clear, touch-friendly UI with filtering and sorting options.
- Manual Expense Entry: Enable manual input and editing of expense data with category management (add, rename, archive).
- Excel Sync: Automatically synchronize transaction data with monthly Excel files for offline access and backup.
- Category color: Category creation workflow which ensures each category gets assigned a visually distinct color.

## Style Guidelines:

- Primary color: Deep Indigo (#663399) to convey trust and financial focus.  This choice considers the subject matter (an expense tracker), but avoids cliches like green. It is also fairly vibrant without being overwhelming.
- Background color: Light Gray (#F0F0F5), offering a neutral backdrop that ensures readability and a professional look, suitable for a light color scheme. This is similar to the hue of the primary color, but desaturated.
- Accent color: Muted Violet (#A78BFA), provides visual interest and highlights key interactive elements such as buttons and CTAs.  This color is analogous to the primary color. By choosing a brighter color we can easily draw attention to important UI elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif for a clean, modern user experience.
- Code font: 'Source Code Pro' for displaying SQL queries.
- Use simple, clear icons to represent expense categories for easy identification.
- Mobile-first design with a bottom tab bar for primary navigation and a floating action button for quick expense addition.
- Subtle animations for transitions and feedback, like expense submission confirmations.