import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all expenses for the dashboard
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[DATABASE_GET_ERROR]:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST: Create a new expense
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // POSTGRES FIX: Force amount to be a clean Integer (Paise/Cents)
    // If user sends 10.50, it becomes 1050. If they send 10, it becomes 1000.
    const amountInCents = Math.round(parseFloat(body.amount) * 100);

    if (isNaN(amountInCents)) {
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: amountInCents,
        category: body.category || "General",
        description: body.description || "",
        date: new Date(body.date || new Date()),
        // clientReferenceId is required by our schema
        clientReferenceId: body.clientReferenceId || crypto.randomUUID(),
      },
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("[DATABASE_POST_ERROR]:", error);
    // If Prisma throws a unique constraint error on clientReferenceId
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Duplicate transaction" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}