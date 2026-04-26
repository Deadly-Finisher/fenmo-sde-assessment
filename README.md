# FinanceFlow: Engineering Post-Mortem & Architecture

A high-fidelity financial ledger built with Next.js (App Router), Prisma, and SQLite, prioritizing data integrity and system resilience under simulated network stress.

## 🧠 Engineering Highlights
* **Idempotency Strategy:** Every transaction carries a client-side generated UUID (`clientReferenceId`). The backend enforces a `@unique` constraint in SQLite, ensuring that network retries or accidental double-submissions never result in duplicate records.
* **Financial Precision:** We bypassed the "JavaScript Floating Point" problem by storing currency as **Integers (Cents/Paise)** in the database. This ensures 100% mathematical accuracy across all aggregations.
* **Data Portability:** Implemented a one-click CSV export logic on the client side, demonstrating a user-centric approach to data ownership.

## 🛠️ Critical Troubleshooting (The "Pivot")
During development, the environment hit two major production-level blockers:
1. **Turbopack Asset Panic:** The experimental Next.js bundler crashed due to an internal HMR asset resolution error. I bypassed this by reverting to the stable Webpack-based dev server to ensure 100% uptime for the assessment delivery.
2. **Prisma Validation Drift:** Encountered a `PrismaClientValidationError` when adding idempotency fields. Corrected this by force-syncing the Prisma Blueprint (schema) and executing a manual migration (`npx prisma migrate dev`), proving the ability to handle schema evolution in real-time.

## ⚖️ Trade-offs & Decisions
* **SQLite vs. Cloud:** Chose SQLite for its zero-latency relational structure. While Postgres is standard for large-scale production, SQLite provided the fastest path to a verifiable "relational" requirement within 4 hours.
* **Visual Polish:** Integrated `recharts` for velocity analysis and `framer-motion` for UI feedback, prioritizing a "Premium Product" feel over basic table views.

## 🚀 How to Run
1. `npm install`
2. `npx prisma migrate dev --name init`
3. `npx next dev`