import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { resumeId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ success: false, error: "Missing resumeId" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Razorpay credentials not configured." }, { status: 500 });
    }

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

    const inr = Math.round(usdPrice * rate);
    const amountPaise = inr * 100;

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
      { success: false, error: "Failed to initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
