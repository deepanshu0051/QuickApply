import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { allowRequest } from '@/lib/rateLimit';

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // ── Rate limiting (10 req/min per IP) ──
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!allowRequest(ip, 10)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests, please try again later.' },
        { status: 429 }
      );
    }

    // ── Content-Type enforcement ──
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type.' },
        { status: 415 }
      );
    }

    // ── Parse body ──
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    let { resumeId } = body;

    // ── Input validation ──
    if (!resumeId || typeof resumeId !== 'string' || !resumeId.trim()) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    resumeId = resumeId.trim();
    if (resumeId.length > 500) {
      return NextResponse.json({ success: false, error: "Invalid request data." }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Payment service is currently unavailable." }, { status: 500 });
    }

    let amountPaise;
    let inr;

    if (process.env.FORCE_AMOUNT_PAISE && !isNaN(Number(process.env.FORCE_AMOUNT_PAISE))) {
      amountPaise = Number(process.env.FORCE_AMOUNT_PAISE);
      inr = amountPaise / 100;
    } else {
      const inrOverride = process.env.INR_OVERRIDE_PRICE;
      if (inrOverride) {
        inr = Number(inrOverride);
      } else {
        const usdPrice = Number(process.env.USD_PRICE || 1);
        let rate = Number(process.env.DEFAULT_USD_INR || 87);

        try {
          const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
          if (rateRes.ok) {
            const rateData = await rateRes.json();
            if (rateData && rateData.rates && rateData.rates.INR) {
              rate = rateData.rates.INR;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch exchange rate, using default.", err);
        }

        inr = Math.round(usdPrice * rate);
      }
      amountPaise = inr * 100;
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `qa_${resumeId.slice(0, 10)}_${Date.now()}`,
      notes: { resumeId }
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      inrAmount: inr
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
