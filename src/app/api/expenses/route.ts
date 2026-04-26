import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");

    const expenses = await prisma.expense.findMany({
      where: {
        category: category && category !== 'All' ? category : undefined,
      },
      orderBy: {
        date: sort === "date_asc" ? "asc" : "desc",
      },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Sync Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, category, description, date, clientReferenceId } = body;

    // 1. Constraint: Block zero or negative values
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount. Must be positive." }, { status: 400 });
    }

    if (!category || !description || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Idempotency Check
    if (clientReferenceId) {
      const existing = await prisma.expense.findUnique({
        where: { clientReferenceId },
      });
      if (existing) return NextResponse.json(existing);
    }

    // 3. Database Creation
    const expense = await prisma.expense.create({
      data: {
        amount: Math.round(parsedAmount * 100), // Integer storage (cents)
        category,
        description,
        date: new Date(date),
        clientReferenceId,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("PRISMA_POST_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}