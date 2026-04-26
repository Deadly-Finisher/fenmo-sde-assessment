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
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, category, description, date, clientReferenceId } = body;

    // 1. Resilience Check: If this ID already exists, don't create it again!
    if (clientReferenceId) {
      const existing = await prisma.expense.findUnique({
        where: { clientReferenceId },
      });
      if (existing) return NextResponse.json(existing);
    }

    // 2. Creation: Using 'amount' to match our new schema
    const expense = await prisma.expense.create({
      data: {
        amount: Math.round(parseFloat(amount) * 100),
        category,
        description,
        date: new Date(date),
        clientReferenceId,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("API_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}