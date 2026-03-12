import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {

  const { id } = await ctx.params

  await connectDB()

  const car = await Car.findById(id).lean()

  if (!car)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(car)
}

export async function DELETE(_req: Request, ctx: Ctx) {

  const { id } = await ctx.params

  await connectDB()

  await Car.findByIdAndDelete(id)

  return NextResponse.json({ ok: true })
}