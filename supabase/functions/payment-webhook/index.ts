import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

interface WebhookPayload {
  provider: string;
  orderId?: string;
  paymentId?: string;
  status: "paid" | "failed" | "pending";
  amount?: number;
  currency?: string;
  signature?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { provider, orderId, status, paymentId } = payload;

    if (!provider || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing provider or orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the payment with the provider (simplified for demo)
    // In production, each provider has its own signature verification:
    //   - Stripe: verify using stripe.webhooks.constructEvent with raw body + Stripe-Signature header
    //   - Payme:  verify via the merchant ID and transaction key
    //   - Click:  verify via the merchant_id and sign_string (MD5 hash)

    let verified = false;
    if (provider === "stripe") {
      // Real Stripe verification would use the Stripe SDK:
      // const stripe = Stripe(STRIPE_SECRET_KEY);
      // const event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      // For this demo, we trust the payload if paymentId is present
      verified = !!paymentId;
    } else if (provider === "payme") {
      // Payme: check method and params in the JSON-RPC body
      verified = !!paymentId;
    } else if (provider === "click") {
      // Click: verify sign_string = md5(order_id + service_id + secret_key)
      verified = !!paymentId;
    } else if (provider === "paypal") {
      // PayPal: verify via the IPN/ webhook signature
      verified = !!paymentId;
    }

    if (!verified) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the order status
    const update: Record<string, string> = { payment_status: status };
    if (status === "paid") {
      // If digital-only order, mark completed; otherwise processing
      const { data: order } = await supabase
        .from("orders")
        .select("shipping_address, order_items(book_type)")
        .eq("id", orderId)
        .maybeSingle();

      const hasPhysical = order?.order_items?.some((i: any) => i.book_type === "physical" || i.book_type === "both");
      update.order_status = hasPhysical ? "processing" : "completed";
    } else if (status === "failed") {
      update.order_status = "cancelled";
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(update)
      .eq("id", orderId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If paid, create digital download tokens for digital items
    if (status === "paid") {
      const { data: items } = await supabase
        .from("order_items")
        .select("book_id, book_type, order:orders(user_id)")
        .eq("order_id", orderId);

      const userId = items?.[0]?.order?.user_id;
      if (userId) {
        const digitalItems = (items || []).filter((i: any) => i.book_type === "digital" || i.book_type === "both");
        if (digitalItems.length > 0) {
          const downloads = digitalItems.map((item: any) => ({
            user_id: userId,
            book_id: item.book_id,
            max_downloads: 5,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }));
          await supabase.from("digital_downloads").insert(downloads);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, provider, orderId, status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
