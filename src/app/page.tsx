'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, SortDesc, Loader2, Wallet, Activity, CheckCircle2, Download, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, sortOrder]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const categoryParam = categoryFilter !== 'All' ? `category=${categoryFilter}&` : '';
      const url = `/api/expenses?${categoryParam}sort=${sortOrder}`;
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      amount: formData.get('amount'),
      category: formData.get('category'),
      description: formData.get('description'),
      date: formData.get('date'),
      clientReferenceId: crypto.randomUUID(), 
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        await fetchExpenses();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + (curr.amount / 100), 0);
    const dailyMap = expenses.reduce((acc: any, curr) => {
      const day = formatDate(curr.date);
      acc[day] = (acc[day] || 0) + (curr.amount / 100);
      return acc;
    }, {});
    const chartData = Object.keys(dailyMap).map(date => ({ date, amount: dailyMap[date] })).reverse().slice(-7);
    return { total, chartData };
  }, [expenses]);

  const exportToCSV = () => {
    const headers = ['Date,Category,Description,Amount($)'];
    const rows = expenses.map((e) => `${formatDate(e.date)},${e.category},"${e.description}",${(e.amount / 100).toFixed(2)}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "ledger_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-zinc-800 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-500 font-mono text-[10px] uppercase tracking-widest">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" /> Vault Online
            </div>
            <h1 className="text-4xl font-bold italic tracking-tighter">FinanceFlow<span className="text-blue-600">.</span></h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={exportToCSV} className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 hover:text-white border border-zinc-800 px-3 py-1 rounded-full transition-all">
              <Download className="w-3 h-3" /> Export Ledger
            </button>
            <div className="text-right font-mono">
               <p className="text-zinc-500 text-[10px] uppercase font-black">Global Assets</p>
               <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <section className="lg:col-span-5 space-y-8">
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-500" /> New Transaction</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Amount</label>
                    <input 
                      name="amount" type="number" step="0.01" min="0.01" 
                      onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                      required className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-white font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Category</label>
                    <select name="category" required className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl outline-none font-bold text-sm">
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                    </select>
                  </div>
                </div>
                <input name="description" placeholder="Description" required className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl outline-none" />
                <input name="date" type="date" required className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                <button disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                  {submitting ? <Loader2 className="mx-auto animate-spin" /> : "Commit Transaction"}
                </button>
              </form>
            </div>
            
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><BarChart3 className="w-3 h-3" /> Spending Velocity</h3>
               <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <XAxis dataKey="date" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '12px'}} />
                    <Bar dataKey="amount">
                      {stats.chartData.map((_, i) => <Cell key={i} fill={i === stats.chartData.length - 1 ? '#3b82f6' : '#27272a'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
               </div>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-6">
            <div className="flex justify-between bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
               <select onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent text-[10px] font-black text-zinc-400 uppercase outline-none cursor-pointer">
                 <option value="All">All Categories</option>
                 <option value="Food">Food</option>
                 <option value="Transport">Transport</option>
               </select>
               <select onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent text-[10px] font-black text-zinc-400 uppercase outline-none cursor-pointer">
                 <option value="date_desc">Newest First</option>
                 <option value="date_asc">Oldest Records</option>
               </select>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {loading ? (
                   <div className="py-20 text-center text-zinc-600 font-mono text-[10px] uppercase animate-pulse">Synchronizing Ledger...</div>
                ) : expenses.length === 0 ? (
                   <div className="py-20 text-center text-zinc-700 font-mono text-[10px] uppercase border-2 border-dashed border-zinc-800 rounded-3xl">Empty Archive</div>
                ) : (
                  expenses.map((expense) => (
                    <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={expense.id} className="group bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center hover:border-zinc-500 transition-all backdrop-blur-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-zinc-200">{expense.description}</p>
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px] font-black uppercase">{expense.category}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">{formatDate(expense.date)} • <CheckCircle2 className="inline w-2.5 h-2.5 text-blue-500/40" /> Verified</p>
                      </div>
                      <p className="text-xl font-mono font-bold text-white tracking-tighter">{formatCurrency(expense.amount / 100)}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}