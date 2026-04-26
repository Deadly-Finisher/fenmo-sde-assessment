'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Load expenses on mount and when filters change [cite: 26, 28-30]
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
    if (submitting) return; // [cite: 52] Prevents multiple submissions

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      amount: formData.get('amount'),
      category: formData.get('category'),
      description: formData.get('description'),
      date: formData.get('date'),
      clientReferenceId: crypto.randomUUID(), // [cite: 24, 25] Resilience for retries
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

  // [cite: 12, 48] Calculate Total for visible expenses
  const total = useMemo(() => {
    return expenses.reduce((acc, curr: any) => acc + (curr.amount / 100), 0);
  }, [expenses]);

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-8 bg-white min-h-screen text-black">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold">Personal Expense Tracker</h1>
        <p className="text-gray-500">Manage and review your personal expenses[cite: 5].</p>
      </header>

      {/*  Expense Form */}
      <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Record New Expense</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Amount ($)</label>
            <input name="amount" type="number" step="0.01" placeholder="0.00" required className="p-2 border rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Category</label>
            <select name="category" required className="p-2 border rounded-md">
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Rent">Rent</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <input name="description" placeholder="What was this for?" required className="p-2 border rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Date</label>
            <input name="date" type="date" required className="p-2 border rounded-md" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="flex items-end">
            <button 
              disabled={submitting}
              className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Processing...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </section>

      {/* [cite: 9, 45-48] Controls & List */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase text-gray-500 font-bold">Filter</label>
              <select onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded-md bg-white">
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Rent">Rent</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase text-gray-500 font-bold">Sort</label>
              <select onChange={(e) => setSortOrder(e.target.value)} className="p-2 border rounded-md bg-white">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
              </select>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase font-bold">Total Expenses</p>
            <p className="text-3xl font-mono font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading expenses... [cite: 61]</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No expenses found. [cite: 61]</td></tr>
              ) : (
                expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 whitespace-nowrap text-gray-600">{formatDate(expense.date)}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{expense.description}</td>
                    <td className="p-4 text-right font-mono font-bold">{formatCurrency(expense.amount / 100)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}