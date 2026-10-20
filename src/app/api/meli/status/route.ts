import { NextResponse } from "next/server";
import { getMeliStatus } from "@/lib/meli/oauth";

export async function GET() {
  return NextResponse.json(await getMeliStatus());
}
