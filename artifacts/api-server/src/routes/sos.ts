import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function toAlert(a: Record<string, unknown>) {
  return {
    id: a.id,
    userId: a.user_id,
    userName: a.user_name,
    hostel: a.hostel,
    campus: a.campus,
    roomNumber: a.room_number ?? null,
    message: a.message ?? null,
    status: a.status,
    resolvedAt: a.resolved_at ?? null,
    resolvedBy: a.resolved_by ?? null,
    createdAt: a.created_at,
  };
}

async function requireAdmin(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (!auth) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = auth.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "class_rep"].includes(profile.role as string)) {
    res.status(403).json({ error: "Admin or class rep access required" });
    return null;
  }
  return user;
}

// Trigger SOS
router.post("/sos", async (req, res) => {
  const { userId, hostel, campus, roomNumber, message } = req.body;

  if (!userId || !hostel || !campus) {
    return res.status(400).json({ error: "userId, hostel, campus are required" });
  }

  let userName = userId;
  const { data: user } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();
  if (user) userName = user.name;

  const { data: alert, error } = await supabase
    .from("sos_alerts")
    .insert({
      user_id: userId,
      user_name: userName,
      hostel,
      campus,
      room_number: roomNumber ?? null,
      message: message ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const campusLabel = campus === "gubi" ? "Gubi" : "Yelwa";
  const roomLabel = roomNumber ? `, Room ${roomNumber}` : "";
  await supabase.from("notifications").insert({
    type: "sos_alert",
    title: `SOS Alert — ${hostel}`,
    body: `Emergency alert from ${userName} at ${hostel}${roomLabel}, ${campusLabel} Campus.${message ? " Message: " + message : ""}`,
    from_hostel: hostel,
    from_campus: campus,
  });

  return res.status(201).json(toAlert(alert));
});

// Get active SOS alerts — only those created within the last 3 days
router.get("/sos/active", async (_req, res) => {
  const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString();

  const { data, error } = await supabase
    .from("sos_alerts")
    .select("*")
    .eq("status", "active")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toAlert));
});

// Resolve SOS alert
router.patch("/sos/:id/resolve", async (req, res) => {
  const { data, error } = await supabase
    .from("sos_alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Alert not found" });
  return res.json(toAlert(data));
});

// DELETE /sos/:id — admin/class_rep only: permanently remove a fake alert
router.delete("/sos/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { error } = await supabase
    .from("sos_alerts")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

export default router;
