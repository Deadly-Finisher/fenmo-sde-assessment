'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ExpenseTracker() {
  interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    createdAt: string;
  }

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Load data on start and whenever filters/sorting change
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
    if (submitting) return; // Prevent double-submits

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Data payload with Idempotency Key
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

  // Derived Data for Analytics
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

  const COLORS = ['#0F6E56', '#1A2E2A', '#6B7370', '#DCEAE0', '#8B9D96'];

  const categories = ['All', 'Food', 'Transport', 'Rent', 'Entertainment', 'Utilities'];

  return (
    <main className="min-h-screen bg-[#F7F8F5] text-[#1A2E2A]">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* Hero Section */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DCEAE0] text-[#0F6E56] px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 bg-[#0F6E56] rounded-full"></span>
            Personal Finance
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Track every rupee{' '}
            <span className="bg-[#DCEAE0] text-[#0F6E56] px-3 py-1 rounded-xl">with intent</span>
          </h1>
          <p className="text-[#6B7370] text-lg max-w-2xl leading-relaxed">
            A resilient tool for tracking personal expenditures with clarity and precision.
          </p>
        </header>

        <div className="border-t border-gray-200/60"></div>

        {/* Analytics Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Expenses - Hero Metric */}
          <div className="bg-[#DCEAE0] rounded-2xl p-6 flex flex-col justify-between">
            <p className="text-[#0F6E56] font-semibold uppercase text-xs tracking-wider">Total Expenses</p>
            <p className="text-4xl font-semibold text-[#0F6E56] mt-3 tabular-nums">
              {formatCurrency(stats.total)}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
            <p className="text-[#6B7370] font-semibold uppercase text-xs tracking-wider">Transactions</p>
            <p className="text-3xl font-semibold mt-3 text-[#1A2E2A] tabular-nums">{expenses.length}</p>
            <p className="text-sm text-[#6B7370] mt-1">Currently filtered list</p>
          </div>

          <div className="bg-white border border-gray-200/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
            <p className="text-[#6B7370] font-semibold uppercase text-xs tracking-wider">Top Category</p>
            <p className="text-3xl font-semibold mt-3 text-[#1A2E2A]">{stats.topCategory}</p>
            <p className="text-sm text-[#6B7370] mt-1">Highest expenditure area</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form & Chart */}
          <section className="lg:col-span-4 space-y-6">
            {/* Form Card */}
            <div className="bg-[#DCEAE0] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#0F6E56]">Record Expense</span>
                <span className="text-[#0F6E56]">→</span>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1A2E2A]/70">Amount ($)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required 
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[#1A2E2A] placeholder:text-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1A2E2A]/70">Category</label>
                  <select 
                    name="category" 
                    required 
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[#1A2E2A] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] appearance-none"
                  >
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Rent">Rent</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1A2E2A]/70">Description</label>
                  <input 
                    name="description" 
                    placeholder="e.g., Weekly Groceries" 
                    required 
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[#1A2E2A] placeholder:text-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1A2E2A]/70">Date</label>
                  <input 
                    name="date" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[#1A2E2A] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]" 
                  />
                </div>
                
                <button 
                  disabled={submitting}
                  className="w-full bg-[#1A2E2A] text-white py-3 rounded-lg font-semibold hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-200"
                >
                  {submitting ? 'Securing Data...' : 'Add Transaction'}
                </button>
              </form>
            </div>

            {/* Pie Chart Card */}
            <div className="bg-white border border-gray-200/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 h-72">
              <h3 className="text-xs font-semibold text-[#6B7370] uppercase tracking-wider mb-4">Spend Breakdown</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.chartData} 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid rgba(0,0,0,0.08)', 
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Right Column: List & Filters */}
          <section className="lg:col-span-8 space-y-6">
            {/* Filter/Sort Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Recent History</h2>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                        categoryFilter === cat 
                          ? 'bg-[#DCEAE0] text-[#0F6E56]' 
                          : 'bg-white border border-gray-200/60 text-[#6B7370] hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                {/* Sort Select */}
                <div className="relative">
                  <select 
                    onChange={(e) => setSortOrder(e.target.value)} 
                    value={sortOrder}
                    className="appearance-none bg-white border border-gray-200/60 rounded-full px-3 py-1.5 pr-8 text-xs font-medium text-[#1A2E2A] outline-none cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7370] text-[10px] pointer-events-none">▼</span>
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-200/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#6B7370]">Transaction Date</th>
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#6B7370]">Details</th>
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#6B7370] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center text-[#6B7370]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-[#DCEAE0] border-t-[#0F6E56] rounded-full animate-spin"></div>
                          <span className="text-sm">Synchronizing with API...</span>
                        </div>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-[#6B7370] text-sm">No records found for this view.</p>
                          <p className="text-[#6B7370]/60 text-xs">Add your first expense to get started →</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense: any, index: number) => (
                      <tr 
                        key={expense.id} 
                        className={`group transition-colors duration-200 hover:bg-[#F7F8F5] ${
                          index !== expenses.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-[#1A2E2A]">{formatDate(expense.date)}</p>
                          <p className="text-xs text-[#6B7370] mt-0.5">Recorded {formatDate(expense.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-3 py-1 bg-[#DCEAE0] text-[#0F6E56] rounded-full text-xs font-medium mb-1.5">
                            {expense.category}
                          </span>
                          <p className="text-sm font-medium text-[#1A2E2A]">{expense.description}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-base font-medium text-[#1A2E2A] tabular-nums">{formatCurrency(expense.amount / 100)}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

