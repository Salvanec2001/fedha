'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'sw';

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    transactions: 'Transactions',
    budgets: 'Budgets',
    goals: 'Savings Goals',
    debts: 'Debts & Receivables',
    recurring: 'Recurring',
    reports: 'Reports',
    history: 'History',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Log out',
    search: 'Search',
    login: 'Log in',
    register: 'Create account',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    yourFinancialOverview: 'Your Financial Overview',
    totalBalance: 'Total Balance',
    incomeThisMonth: 'Income This Month',
    expensesThisMonth: 'Expenses This Month',
    netCashFlow: 'Net Cash Flow',
    addTransaction: 'Add a transaction',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Remove',
    edit: 'Edit',
    language: 'Language',
  },
  sw: {
    dashboard: 'Dashibodi',
    accounts: 'Akaunti',
    transactions: 'Miamala',
    budgets: 'Bajeti',
    goals: 'Malengo ya Akiba',
    debts: 'Madeni na Stahiki',
    recurring: 'Yanayojirudia',
    reports: 'Ripoti',
    history: 'Historia',
    profile: 'Wasifu',
    admin: 'Msimamizi',
    logout: 'Ondoka',
    search: 'Tafuta',
    login: 'Ingia',
    register: 'Fungua akaunti',
    email: 'Barua pepe',
    password: 'Nenosiri',
    forgotPassword: 'Umesahau nenosiri?',
    yourFinancialOverview: 'Muhtasari wa Fedha Zako',
    totalBalance: 'Salio Jumla',
    incomeThisMonth: 'Mapato ya Mwezi Huu',
    expensesThisMonth: 'Matumizi ya Mwezi Huu',
    netCashFlow: 'Mtiririko wa Fedha',
    addTransaction: 'Ongeza muamala',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    remove: 'Ondoa',
    edit: 'Hariri',
    language: 'Lugha',
  },
};

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('fedha_lang') as Lang | null) : null;
    if (stored === 'en' || stored === 'sw') setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('fedha_lang', l);
  }

  function t(key: string) {
    return DICT[lang][key] ?? DICT.en[key] ?? key;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
