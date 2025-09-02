import type { Metadata } from 'next';
import { Orbitron, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-headline' });
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-code',
});

export const metadata: Metadata = {
  title: 'ExpenseAI',
  description: 'AI-powered expense tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${sourceCodePro.variable} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
