# Fenmo-Inspired Financial Command Center

A high-fidelity fintech dashboard built for the SDE assessment. 

## 🚀 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Neon.tech
- **ORM:** Prisma
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## ✨ Key Features
- **Persistent Storage:** Full CRUD operations backed by a cloud Postgres DB.
- **Spend Pulse:** Historical line graph tracking spend velocity.
- **Smart Budgeting:** Dynamic 'Remaining Balance' calculation based on checked commitments.
- **Localization:** Indian Rupee (₹) formatting with `en-IN` locale.

## 🛠️ Setup
1. Clone the repo.
2. Run `npm install`.
3. Set `DATABASE_URL` in your `.env`.
4. Run `npx prisma db push`.
5. Visit `/api/seed` to populate the dashboard.