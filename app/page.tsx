'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Load data on start and whenever filters/sorting change [cite: 26, 28-30]
  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, sortOrder]);

  async function fetchExpenses() {
    setLoading(true);
    const url = `/api/expenses?${categoryFilter !== 'All' ? `category=${categoryFilter}&` : ''}sort=${sortOrder}`;
    const res = await fetch(url);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return; // [cite: 52] Prevent double-submits

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // [cite: 21, 24] Data payload with Idempotency Key
    const payload = {
      amount: formData.get('amount'),
      category: formData.get('category'),
      description: formData.get('description'),
      date: formData.get('date'),
      clientReferenceId: crypto.randomUUID(), // Handles network retries/page reloads 
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        fetchExpenses();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // [cite: 12, 48, 59] Derived Data for Analytics
  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr: any) => acc + (curr.amount / 100), 0);
    const categoryMap = expenses.reduce((acc: any, curr: any) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount / 100);
      return acc;
    }, {});
    
    const chartData = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));

    const topCategory = chartData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A';

    return { total, chartData, topCategory };
  }, [expenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-white min-h-screen text-slate-900">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">FinanceFlow Dashboard</h1>
          <p className="text-slate-500">A resilient tool for tracking personal expenditures[cite: 4, 5].</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex gap-2">
           <div className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-bold text-blue-600">
             Production Ready
           </div>
        </div>
      </header>

      {/*  Analytics Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-600 text-white rounded-2xl shadow-lg flex flex-col justify-between">
          <p className="text-blue-100 font-semibold uppercase text-xs tracking-wider">Total Visible Spending</p>
          <p className="text-4xl font-bold mt-2">{formatCurrency(stats.total)}</p>
        </div>
        
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Transactions</p>
          <p className="text-3xl font-bold mt-2 text-slate-800">{expenses.length}</p>
          <p className="text-sm text-slate-500 mt-1">Currently filtered list</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Top Category</p>
          <p className="text-3xl font-bold mt-2 text-slate-800">{stats.topCategory}</p>
          <p className="text-sm text-slate-500 mt-1">Highest expenditure area</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* [cite: 8, 43] Left Column: Input Form */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Record Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Amount ($)</label>
                <input name="amount" type="number" step="0.01" placeholder="0.00" required className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                <select name="category" required className="w-full p-3 border rounded-xl bg-white">
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Rent">Rent</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                <input name="description" placeholder="e.g., Weekly Groceries" required className="w-full p-3 border rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Date</label>
                <input name="date" type="date" required className="w-full p-3 border rounded-xl" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <button 
                disabled={submitting}
                className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {submitting ? 'Securing Data...' : 'Add Transaction'}
              </button>
            </form>
          </div>

          {/* Visual Spend Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-64">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Spend Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* [cite: 9, 44] Right Column: List & Filters */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold">Recent History</h2>
            <div className="flex gap-2">
              <select onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-slate-50 font-medium">
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Rent">Rent</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
              </select>
              <select onChange={(e) => setSortOrder(e.target.value)} className="p-2 border rounded-lg text-sm bg-slate-50 font-medium">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* [cite: 61] Table with State Management */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="p-5">Transaction Date</th>
                  <th className="p-5">Details</th>
                  <th className="p-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="p-12 text-center text-slate-400 animate-pulse">Synchronizing with API...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={3} className="p-12 text-center text-slate-400">No records found for this view.</td></tr>
                ) : (
                  expenses.map((expense: any) => (
                    <tr key={expense.id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="p-5 whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{formatDate(expense.date)}</p>
                        <p className="text-xs text-slate-400">Recorded {formatDate(expense.createdAt)}</p>
                      </td>
                      <td className="p-5">
                        <span className="inline-block px-2 py-0.5 mb-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                          {expense.category}
                        </span>
                        <p className="text-sm font-medium text-slate-800">{expense.description}</p>
                      </td>
                      <td className="p-5 text-right">
                        <p className="text-lg font-mono font-bold text-slate-900">{formatCurrency(expense.amount / 100)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}