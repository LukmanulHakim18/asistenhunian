import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

const updateStatusSchema = z.object({
  status: z.enum(["confirmed", "in_progress", "completed", "cancelled"]),
  confirmedDatetime: z.string().datetime().optional(),
  obNotes: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    // Verify user is OB or admin
    const { data: profile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<{ role: string }[]>()
      .single();

    if (!profile || (profile.role !== "ob" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, confirmedDatetime, obNotes } = parsed.data;

    const supabase = createAdminClient();

    // Get current order
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("id, status, ob_id")
      .eq("id", id)
      .single();

    if (!currentOrder) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const currentStatus = currentOrder.status as OrderStatus;
    const validNext = VALID_TRANSITIONS[currentStatus];
    if (!validNext.includes(status)) {
      return NextResponse.json(
        { error: `Tidak bisa mengubah status dari ${currentStatus} ke ${status}` },
        { status: 422 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = { status };
    if (status === "confirmed" && confirmedDatetime) {
      updateData.confirmed_datetime = confirmedDatetime;
    }
    if (obNotes) {
      updateData.ob_notes = obNotes;
    }
    // Assign OB if not yet assigned
    if (!currentOrder.ob_id && profile.role === "ob") {
      updateData.ob_id = user.id;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
    }

    // Insert status history
    await supabase.from("order_status_history").insert({
      order_id: id,
      old_status: currentStatus,
      new_status: status,
      changed_by: user.id,
      notes: obNotes ?? null,
    });

    // TODO (Phase 4): Trigger notification to customer

    return NextResponse.json({ success: true, newStatus: status });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
