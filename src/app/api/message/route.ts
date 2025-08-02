import { NextRequest, NextResponse } from "next/server";
// TODO: Update the import path below if your actions file is located elsewhere
import { message } from "../../actions";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const result = await message(messages);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || "Unknown error" }, { status: 500 });
  }
}
