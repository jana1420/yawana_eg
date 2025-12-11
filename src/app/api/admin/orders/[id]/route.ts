import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const updateOrderSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { status } = parsed.data;

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not update order" },
      {
        status: 500,
      },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "update_order_status",
    entityType: "order",
    entityId: id,
    description: `Updated order status to ${status}`,
  });

  return NextResponse.json({ id }, { status: 200 });
}
