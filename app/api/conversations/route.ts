import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "1",
      car: "2020 Toyota Camry",
      buyer: "John",
      lastMessage: "Is this still available?",
    },
    {
      id: "2",
      car: "2019 Honda Accord",
      buyer: "Mike",
      lastMessage: "Can we schedule a test drive?",
    },
  ]);
}