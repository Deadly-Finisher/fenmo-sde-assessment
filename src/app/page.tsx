'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, SortDesc, Loader2, Wallet, Activity, CheckCircle2, Download, BarChart3, ArrowRight } from 'lucide-react';
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
    const headers = ['Date,Category,Description,Amount(₹)'];
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
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A2E2A] font-sans selection:bg-[#DCEAE0]">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* HERO SECTION */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DCEAE0] text-[#0F6E56] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#0F6E56] rounded-full animate-pulse" />
            Personal Finance
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Track every rupee with <span className="bg-[#DCEAE0] px-2 rounded-lg whitespace-nowrap">clear intent</span>
            </h1>
            <p className="mt-4 text-[#6B7370] text-lg max-w-lg">
              A minimalist command center for your expenditures. Built for precision and financial clarity.
            </p>
          </div>
        </header>

        <hr className="border-gray-200/60" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: TOTAL & FORM */}
          <section className="lg:col-span-5 space-y-10">
            
            {/* TOTAL METRIC CARD */}
            <div className="bg-[#DCEAE0] p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[#0F6E56] text-xs font-semibold tracking-widest uppercase mb-1">Total Expenses</p>
              <p className="text-4xl md:text-5xl font-semibold tabular-nums text-[#0F6E56]">
                {formatCurrency(stats.total)}
              </p>
            </div>

            {/* FORM CARD */}
            <div className="bg-[#DCEAE0] p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-[#0F6E56] text-xs font-semibold tracking-wider uppercase">Record Transaction</h2>
                <ArrowRight className="w-4 h-4 text-[#0F6E56]" />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    name="amount" type="number" step="0.01" min="0.01" 
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    placeholder="Amount (₹)"
                    required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-all tabular-nums text-sm" 
                  />
                  <select name="category" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] text-sm font-medium">
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <input name="description" placeholder="Description" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] text-sm" />
                <input name="date" type="date" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                <button 
                  disabled={submitting} 
                  className="w-full bg-[#1A2E2A] text-white py-3.5 rounded-lg font-medium transition-all hover:bg-[#1A2E2A]/90 active:translate-y-0.5 flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Log Entry"}
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT COLUMN: ANALYTICS & LIST */}
          <section className="lg:col-span-7 space-y-8">
            
            {/* ANALYTICS SECTION */}
            <div className="bg-white border border-gray-200/70 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7370] flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#0F6E56]" /> Spend Velocity
                </h3>
                <button onClick={exportToCSV} className="text-[10px] font-bold uppercase tracking-widest text-[#6B7370] hover:text-[#1A2E2A] transition-colors border border-gray-200 px-3 py-1 rounded-full flex items-center gap-2">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <XAxis dataKey="date" hide />
                    <Tooltip cursor={{fill: '#F7F8F5'}} contentStyle={{backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '11px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="amount">
                      {stats.chartData.map((_, i) => <Cell key={i} fill={i === stats.chartData.length - 1 ? '#0F6E56' : '#DCEAE0'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CONTROLS & TABLE */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold tracking-tight">Recent Activity</h3>
                <div className="flex items-center gap-3">
                  <select 
                    onChange={(e) => setCategoryFilter(e.target.value)} 
                    className="bg-transparent text-xs font-semibold text-[#0F6E56] border-b-2 border-[#DCEAE0] outline-none py-1 focus:border-[#0F6E56] transition-all cursor-pointer uppercase tracking-widest"
                  >
                    <option value="All">All Categories</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Rent">Rent</option>
                  </select>
                  <select 
                    onChange={(e) => setSortOrder(e.target.value)} 
                    className="bg-transparent text-xs font-semibold text-[#0F6E56] border-b-2 border-[#DCEAE0] outline-none py-1 focus:border-[#0F6E56] transition-all cursor-pointer uppercase tracking-widest"
                  >
                    <option value="date_desc">Newest</option>
                    <option value="date_asc">Archive</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                       <div className="py-24 text-center text-[#6B7370] text-sm animate-pulse font-medium">Syncing Ledger...</div>
                    ) : expenses.length === 0 ? (
                       <div className="py-24 text-center text-[#6B7370] text-sm font-medium">No records identified in current view.</div>
                    ) : (
                      expenses.map((expense) => (
                        <motion.div 
                          layout 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          key={expense.id} 
                          className="group p-5 flex justify-between items-center transition-colors hover:bg-[#F7F8F5]"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                              <span className="bg-[#DCEAE0] text-[#0F6E56] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {expense.category}
                              </span>
                              <p className="font-semibold text-[15px]">{expense.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[#6B7370] text-xs">
                              {formatDate(expense.date)}
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <CheckCircle2 className="w-3 h-3 text-[#0F6E56]/40" />
                            </div>
                          </div>
                          <p className="text-lg font-semibold tabular-nums tracking-tight">
                            {formatCurrency(expense.amount / 100)}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}