import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Clear existing data
    await prisma.expense.deleteMany({});

    // 2. Generate 15 synthetic items
    const categories = ["Food", "Transport", "Utilities", "Rent"];
    const now = new Date();
    
    const syntheticData = Array.from({ length: 15 }).map((_, i) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      return {
        amount: category === "Rent" ? 2500000 : Math.floor(Math.random() * 500000) + 10000,
        category,
        description: `Synthetic ${category} Entry`,
        date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
        clientReferenceId: crypto.randomUUID(),
      };
    });

    await prisma.expense.createMany({ data: syntheticData });

    return NextResponse.json({ message: "Postgres seeded successfully", count: 15 });
  } catch (error: any) {
    console.error("[SEED_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}