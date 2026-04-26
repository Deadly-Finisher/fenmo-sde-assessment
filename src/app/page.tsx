"use client";

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Wallet, CheckCircle2 } from 'lucide-react';

// --- TYPES (Fixed: Property does not exist errors) ---
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Commitment {
  id: number;
  name: string;
  amount: number;
  active: boolean;
}

// --- SUB-COMPONENT: STAT CARD ---
function StatCard({ title, value, color = "bg-white" }: { title: string; value: number; color?: string }) {
  return (
    <div className={`${color} p-8 rounded-[32px] border border-black/5 shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">{title}</p>
      <p className="text-3xl font-bold">
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function FenmoDashboard() {
  // State with explicit types
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [targetBudget] = useState<number>(100000);

  const [commitments, setCommitments] = useState<Commitment[]>([
    { id: 1, name: "Monthly Rent", amount: 25000, active: true },
    { id: 2, name: "House Help", amount: 5000, active: true },
    { id: 3, name: "Electricity Bill", amount: 3000, active: true },
    { id: 4, name: "Life Insurance", amount: 2000, active: false },
  ]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleCommit = async () => {
    if (!amount) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, category, date }),
      });
      if (res.ok) {
        setAmount("");
        fetchExpenses();
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const toggleCommitment = (id: number) => {
    setCommitments(prev => prev.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  // Calculations
  const totalCommitted = commitments
    .filter(c => c.active)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const variableSpend = expenses.reduce((sum, e) => sum + (e.amount / 100), 0);
  const remainingBalance = targetBudget - totalCommitted - variableSpend;

  // Chart Data Preparation (Sorted by date)
  const chartData = [...expenses]
    .map(e => ({
      name: new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      amount: e.amount / 100,
      rawDate: new Date(e.date).getTime()
    }))
    .sort((a, b) => a.rawDate - b.rawDate);

  return (
    <div className="min-h-screen bg-[#F7F9F7] p-8 font-sans text-[#1A2C2B]">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#0F6E56] rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0F6E56]/60">Fintech Ledger Pro</span>
        </div>
        <h1 className="text-4xl font-light">Monthly Financial <span className="bg-[#DCEAE0] px-3 py-1 rounded-xl font-medium">Command Center</span></h1>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
        {/* Top Metric Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Target Budget" value={targetBudget} />
          <StatCard title="Total Committed" value={totalCommitted} color="bg-[#DCEAE0]" />
          <StatCard title="Remaining Balance" value={remainingBalance} />
        </div>

        {/* Sidebar: Commitments & Logging */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-6">
              <CheckCircle2 size={14} className="text-[#0F6E56]" /> Commitments
            </h3>
            <div className="space-y-3">
              {commitments.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#F7F9F7] rounded-xl border border-black/[0.03]">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={item.active} 
                      onChange={() => toggleCommitment(item.id)} 
                      className="accent-[#0F6E56] w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-sm">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#DCEAE0] p-6 rounded-3xl">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F6E56] mb-6">Variable Logs</h3>
            <div className="flex flex-col gap-3">
              <input 
                type="number" placeholder="Amount (₹)" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="p-4 rounded-2xl border-none outline-none text-lg font-medium" 
              />
              {/* DATE PICKER ADDED */}
              <input 
                type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-4 rounded-2xl border-none outline-none text-sm text-gray-500" 
              />
              <select 
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="p-4 rounded-2xl border-none outline-none text-sm bg-white appearance-none"
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
              </select>
              <button 
                onClick={handleCommit}
                className="bg-[#1A2C2B] text-white p-5 rounded-2xl font-bold hover:bg-black transition-all mt-2"
              >
                Commit Transaction
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Chart & Recent Transactions */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="bg-white p-8 rounded-[40px] border border-black/5 min-h-[400px]">
            <h3 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-8">
              <Wallet size={14} className="text-[#0F6E56]" /> Spend Pulse
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F6E56" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'}}
                    // FIXED: Any-type prevents the formatter squiggle
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0F6E56" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorAmt)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Transaction Ledger */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/30 px-4">Recent Transactions</h4>
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="bg-white p-6 rounded-3xl flex justify-between items-center border border-black/5 hover:border-[#0F6E56]/20 transition-all">
                <div>
                  <span className="text-[10px] font-bold bg-[#DCEAE0] text-[#0F6E56] px-2 py-1 rounded-md uppercase tracking-tighter">{exp.category}</span>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">{new Date(exp.date).toDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{(exp.amount / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}