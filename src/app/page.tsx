'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, SortDesc, Loader2, CheckCircle2, Download, BarChart3, ArrowRight, Edit3, CalendarCheck2, Trash2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface RecurringItem {
  id: string;
  label: string;
  amount: number;
  checked: boolean;
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');
  
  // Budget State
  const [totalBudget, setTotalBudget] = useState(100000); 
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // --- Dynamic Monthly Commitments State ---
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([
    { id: '1', label: 'Monthly Rent', amount: 25000, checked: false },
    { id: '2', label: 'House Help', amount: 5000, checked: false },
    { id: '3', label: 'Electricity Bill', amount: 3000, checked: false },
    { id: '6', label: 'Life Insurance', amount: 2000, checked: false },
  ]);

  // Temporary state for new commitment inputs
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

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

  // --- Commitment Management Logic ---
  const addRecurringItem = () => {
    if (!newItemLabel || !newItemAmount) return;
    const newItem: RecurringItem = {
      id: crypto.randomUUID(),
      label: newItemLabel,
      amount: parseFloat(newItemAmount),
      checked: false
    };
    setRecurringItems([...recurringItems, newItem]);
    setNewItemLabel('');
    setNewItemAmount('');
  };

  const removeRecurringItem = (id: string) => {
    setRecurringItems(recurringItems.filter(item => item.id !== id));
  };

  const updateRecurringAmount = (id: string, newAmount: number) => {
    setRecurringItems(items => items.map(item => 
      item.id === id ? { ...item, amount: newAmount } : item
    ));
  };

  const toggleRecurring = (id: string) => {
    setRecurringItems(items => items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

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
    const dailyExpensesTotal = expenses.reduce((acc, curr) => acc + (curr.amount / 100), 0);
    const committedRecurringTotal = recurringItems
      .filter(item => item.checked)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalSpent = dailyExpensesTotal + committedRecurringTotal;
    const availableBudget = totalBudget - totalSpent;
    
    const dailyMap = expenses.reduce((acc: any, curr) => {
      const day = formatDate(curr.date);
      acc[day] = (acc[day] || 0) + (curr.amount / 100);
      return acc;
    }, {});
    
    const chartData = Object.keys(dailyMap).map(date => ({ date, amount: dailyMap[date] })).reverse().slice(-7);
    
    return { totalSpent, availableBudget, chartData };
  }, [expenses, totalBudget, recurringItems]);

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A2E2A] font-sans selection:bg-[#DCEAE0]">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* HERO SECTION */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DCEAE0] text-[#0F6E56] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#0F6E56] rounded-full animate-pulse" />
            Fintech Ledger Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Monthly Financial <span className="bg-[#DCEAE0] px-2 rounded-lg whitespace-nowrap">Command Center</span>
          </h1>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200/70 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative group">
            <p className="text-[#6B7370] text-[10px] font-bold tracking-widest uppercase mb-1 flex justify-between items-center">
              Target Budget <button onClick={() => setIsEditingBudget(!isEditingBudget)}><Edit3 className="w-3 h-3 text-[#0F6E56] opacity-0 group-hover:opacity-100 transition-opacity" /></button>
            </p>
            {isEditingBudget ? (
              <input autoFocus type="number" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))} onBlur={() => setIsEditingBudget(false)} className="text-2xl font-semibold bg-[#F7F8F5] w-full outline-none" />
            ) : (
              <p className="text-3xl font-semibold tabular-nums">{formatCurrency(totalBudget)}</p>
            )}
          </div>

          <div className="bg-[#DCEAE0] p-6 rounded-2xl">
            <p className="text-[#0F6E56] text-[10px] font-bold tracking-widest uppercase mb-1">Total Committed</p>
            <p className="text-3xl font-semibold tabular-nums text-[#0F6E56]">{formatCurrency(stats.totalSpent)}</p>
          </div>

          <div className={`p-6 rounded-2xl border transition-colors ${stats.availableBudget < 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200/70'}`}>
            <p className={`${stats.availableBudget < 0 ? 'text-red-600' : 'text-[#6B7370]'} text-[10px] font-bold tracking-widest uppercase mb-1`}>Remaining Balance</p>
            <p className={`text-3xl font-semibold tabular-nums ${stats.availableBudget < 0 ? 'text-red-600' : 'text-[#0F6E56]'}`}>{formatCurrency(stats.availableBudget)}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: EDITABLE COMMITMENTS & FORM */}
          <section className="lg:col-span-5 space-y-8">
            
            {/* EDITABLE MONTHLY COMMITMENTS */}
            <div className="bg-white border border-gray-200/70 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-[#6B7370] text-xs font-semibold tracking-widest uppercase flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-[#0F6E56]" /> Commitments
                </h2>
              </div>

              {/* Add New Item Inputs */}
              <div className="flex gap-2 pb-4 border-b border-gray-100">
                <input 
                  value={newItemLabel} 
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="New item (e.g. WiFi)" 
                  className="flex-grow text-xs p-2 bg-[#F7F8F5] rounded-lg outline-none focus:ring-1 focus:ring-[#0F6E56]/20" 
                />
                <input 
                  type="number"
                  value={newItemAmount} 
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  placeholder="Amount" 
                  className="w-20 text-xs p-2 bg-[#F7F8F5] rounded-lg outline-none" 
                />
                <button onClick={addRecurringItem} className="bg-[#0F6E56] text-white p-2 rounded-lg hover:opacity-90">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {recurringItems.map((item) => (
                    <motion.div 
                      layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }}
                      key={item.id} 
                      className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${item.checked ? 'bg-[#DCEAE0]/30 border-[#DCEAE0]' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={item.checked} onChange={() => toggleRecurring(item.id)} className="w-4 h-4 text-[#0F6E56]" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={item.amount} 
                          onChange={(e) => updateRecurringAmount(item.id, Number(e.target.value))}
                          className="w-20 text-right text-sm font-mono font-bold bg-transparent outline-none focus:bg-white px-1 rounded"
                        />
                        <button onClick={() => removeRecurringItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* TRANSACTION FORM */}
            <div className="bg-[#DCEAE0] p-8 rounded-2xl space-y-6">
              <h2 className="text-[#0F6E56] text-xs font-semibold tracking-wider uppercase">Variable Logs</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount (₹)" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-sm font-mono" />
                  <select name="category" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold">
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <button disabled={submitting} className="w-full bg-[#1A2E2A] text-white py-3.5 rounded-lg font-medium">
                  {submitting ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Commit Transaction"}
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT: CHART & ACTIVITY */}
          <section className="lg:col-span-7 space-y-8">
            <div className="bg-white border border-gray-200/70 p-8 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7370] flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-[#0F6E56]" /> Spend Pulse</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs><linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F6E56" stopOpacity={0.15}/><stop offset="95%" stopColor="#0F6E56" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="date" hide /><YAxis hide domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="amount" stroke="#0F6E56" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {expenses.map((expense) => (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={expense.id} className="p-5 flex justify-between items-center hover:bg-[#F7F8F5]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#DCEAE0] text-[#0F6E56] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">{expense.category}</span>
                        <p className="font-semibold text-sm">{expense.description}</p>
                      </div>
                      <p className="text-[#6B7370] text-[10px] uppercase font-bold tracking-wider">{formatDate(expense.date)}</p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-[#1A2E2A]">{formatCurrency(expense.amount / 100)}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}