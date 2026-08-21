import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fedha — Your Money. Your Plan. Your Future.',
  description: 'Fedha is a professional personal financial management platform for tracking money, managing budgets, building savings, managing debt, and making smarter financial decisions.',
  themeColor: '#0B1F3A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
