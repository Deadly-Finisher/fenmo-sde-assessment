'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, SortDesc, Loader2, CheckCircle2, Download, BarChart3, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

    const formData = new FormData(e.currentTarget);
    const amountVal = formData.get('amount') as string;
    
    if (parseFloat(amountVal) <= 0) {
      alert("Please enter a positive amount.");
      return;
    }

    setSubmitting(true);
    const payload = {
      amount: amountVal,
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
    link.setAttribute("download", `vault_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A2E2A] font-sans selection:bg-[#DCEAE0]">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* HERO SECTION */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DCEAE0] text-[#0F6E56] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#0F6E56] rounded-full animate-pulse" />
            Fintech Ledger
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Track every rupee with <span className="bg-[#DCEAE0] px-2 rounded-lg whitespace-nowrap">clear intent</span>
            </h1>
            <p className="mt-4 text-[#6B7370] text-lg">
              Precision accounting for the modern CFO. Secure, idempotent, and highly visual.
            </p>
          </div>
        </header>

        <hr className="border-gray-200/60" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* COLUMN 1: METRICS & ENTRY */}
          <section className="lg:col-span-5 space-y-10">
            <div className="bg-[#DCEAE0] p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[#0F6E56] text-xs font-semibold tracking-widest uppercase mb-1">Total Expenses</p>
              <p className="text-4xl md:text-5xl font-semibold tabular-nums text-[#0F6E56]">
                {formatCurrency(stats.total)}
              </p>
            </div>

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
                    required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-all text-sm" 
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
                <button disabled={submitting} className="w-full bg-[#1A2E2A] text-white py-3.5 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.99] flex justify-center items-center gap-2">
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Log Entry"}
                </button>
              </form>
            </div>
          </section>

          {/* COLUMN 2: LINE CHART & LEDGER */}
          <section className="lg:col-span-7 space-y-8">
            
            {/* UPDATED: AREA/LINE CHART */}
            <div className="bg-white border border-gray-200/70 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7370] flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#0F6E56]" /> Spend Velocity
                </h3>
                <button onClick={exportToCSV} className="text-[10px] font-bold uppercase tracking-widest text-[#6B7370] hover:text-[#1A2E2A] border border-gray-200 px-3 py-1 rounded-full flex items-center gap-2 transition-colors">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0F6E56" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      cursor={{ stroke: '#DCEAE0', strokeWidth: 2 }} 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '11px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#0F6E56" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LEDGER FEED */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Recent Activity</h3>
                <div className="flex items-center gap-4">
                  <select onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-[#0F6E56] border-b border-[#DCEAE0] outline-none py-1 hover:border-[#0F6E56] transition-all cursor-pointer uppercase">
                    <option value="All">All Categories</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                  </select>
                  <select onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent text-xs font-semibold text-[#0F6E56] border-b border-[#DCEAE0] outline-none py-1 hover:border-[#0F6E56] transition-all cursor-pointer uppercase">
                    <option value="date_desc">Newest</option>
                    <option value="date_asc">Oldest</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                       <div className="py-24 text-center text-[#6B7370] text-sm font-medium animate-pulse">Syncing...</div>
                    ) : expenses.length === 0 ? (
                       <div className="py-24 text-center text-[#6B7370] text-sm font-medium">Vault Empty.</div>
                    ) : (
                      expenses.map((expense) => (
                        <motion.div 
                          layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                          key={expense.id} 
                          className="group p-5 flex justify-between items-center hover:bg-[#F7F8F5] transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="bg-[#DCEAE0] text-[#0F6E56] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                {expense.category}
                              </span>
                              <p className="font-semibold text-sm">{expense.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[#6B7370] text-[10px] uppercase font-bold tracking-wider">
                              {formatDate(expense.date)}
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#0F6E56]/30" />
                            </div>
                          </div>
                          <p className="text-lg font-semibold tabular-nums">
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