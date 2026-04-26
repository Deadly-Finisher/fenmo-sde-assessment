# Personal Expense Tracker - Technical Assessment

A minimal, resilient full-stack expense tracker built with Next.js, TypeScript, and Prisma/SQLite.

## Key Design Decisions
* **Money Handling:** Used an `Int` type for the `amount` field in the database. [cite_start]All values are stored as cents (e.g., $10.50 = 1050) to prevent floating-point rounding errors typical in financial applications[cite: 33, 74].
* **Resilience & Idempotency:** Implemented a `clientReferenceId` (UUID) sent from the frontend. [cite_start]The backend checks this ID before creation to ensure that network retries or double-clicks do not result in duplicate expenses [cite: 6, 24, 25, 52-54].
* [cite_start]**Tech Stack:** Chose SQLite for persistence to provide a relational structure without the overhead of an external database server, ensuring the app is easy to review and run locally [cite: 38-40].

## Trade-offs
* [cite_start]**UI Framework:** Prioritized standard Tailwind CSS over complex component libraries to keep the bundle size small and focus on logic correctness[cite: 13, 55].
* [cite_start]**State Management:** Used React's `useState` and `useMemo` for simplicity given the small feature set, rather than introducing Redux or Zustand[cite: 71, 77].

## Future Improvements (What I would do next)
* [cite_start]Add comprehensive Unit/E2E tests using Jest and Playwright[cite: 60].
* Implement user authentication (e.g., NextAuth.js) to support multiple accounts.
* [cite_start]Add a summary chart (Total per Category) for better data visualization[cite: 59].