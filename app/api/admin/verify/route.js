import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const secret = process.env.ADMIN_SECRET_KEY;

    if (!secret) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    if (key === secret) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
