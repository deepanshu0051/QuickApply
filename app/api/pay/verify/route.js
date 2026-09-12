import { NextResponse } from "next/server";
import crypto from "crypto";
import { signToken } from "@/lib/paymentToken";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // ── Content-Type enforcement ──
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type.' },
        { status: 415 }
      );
    }

    // ── Parse body ──
    let bodyData;
    try {
      bodyData = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    let { resumeId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyData;

    // ── Input validation ──
    if (
      !resumeId || typeof resumeId !== 'string' || !resumeId.trim() ||
      !razorpay_order_id || typeof razorpay_order_id !== 'string' || !razorpay_order_id.trim() ||
      !razorpay_payment_id || typeof razorpay_payment_id !== 'string' || !razorpay_payment_id.trim() ||
      !razorpay_signature || typeof razorpay_signature !== 'string' || !razorpay_signature.trim()
    ) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    resumeId = resumeId.trim();
    razorpay_order_id = razorpay_order_id.trim();
    razorpay_payment_id = razorpay_payment_id.trim();
    razorpay_signature = razorpay_signature.trim();
    
    if (
      resumeId.length > 500 || 
      razorpay_order_id.length > 500 || 
      razorpay_payment_id.length > 500 || 
      razorpay_signature.length > 500
    ) {
      return NextResponse.json({ success: false, error: "Invalid request data." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Payment service is currently unavailable." }, { status: 500 });
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
      exp: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      oid: razorpay_order_id,
      pid: razorpay_payment_id
    };

    const accessToken = signToken(payload);

    return NextResponse.json({ success: true, accessToken });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
