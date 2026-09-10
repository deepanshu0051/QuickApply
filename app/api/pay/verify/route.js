import { NextResponse } from "next/server";
import crypto from "crypto";
import { signToken } from "@/lib/paymentToken";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { resumeId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!resumeId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Razorpay credentials not configured." }, { status: 500 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed." },
        { status: 401 }
      );
    }

    const payload = {
      rid: resumeId,
      exp: Date.now() + 10 * 60 * 1000,
      oid: razorpay_order_id,
      pid: razorpay_payment_id
    };

    const accessToken = signToken(payload);

    return NextResponse.json({ success: true, accessToken });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
