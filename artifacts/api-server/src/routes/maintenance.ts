import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

function toTicket(t: Record<string, unknown>) {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    category: t.category,
    status: t.status,
    priority: t.priority,
    hostel: t.hostel,
    campus: t.campus,
    roomNumber: t.room_number ?? null,
    reportedBy: t.reported_by,
    reportedByName: t.reported_by_name,
    assignedTo: t.assigned_to ?? null,
    notes: t.notes ?? null,
    imageUrl: t.image_url ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

// List tickets (with optional status filter)
router.get("/maintenance", async (req, res) => {
  let query = supabase
    .from("maintenance_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (req.query.status) {
    query = query.eq("status", req.query.status as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toTicket));
});

// Maintenance stats
router.get("/maintenance/stats", async (_req, res) => {
  const { data, error } = await supabase
    .from("maintenance_tickets")
    .select("status, category");

  if (error) return res.status(500).json({ error: error.message });

  const tickets = data ?? [];
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  const catMap: Record<string, number> = {};
  for (const t of tickets) {
    catMap[t.category] = (catMap[t.category] ?? 0) + 1;
  }
  const byCategory = Object.entries(catMap).map(([category, count]) => ({
    category,
    count,
  }));

  return res.json({ total, open, inProgress, resolved, byCategory });
});

// Get single ticket
router.get("/maintenance/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("maintenance_tickets")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data)
    return res.status(404).json({ error: "Ticket not found" });
  return res.json(toTicket(data));
});

// Create ticket
router.post("/maintenance", async (req, res) => {
  const {
    title,
    description,
    category,
    priority,
    hostel,
    campus,
    roomNumber,
    reportedBy,
    reportedByName,
  } = req.body;

  if (!title || !category || !priority || !hostel || !campus || !reportedBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let resolvedName = reportedByName ?? reportedBy;
  if (!reportedByName) {
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", reportedBy)
      .single();
    if (user) resolvedName = user.name;
  }

  const { data, error } = await supabase
    .from("maintenance_tickets")
    .insert({
      title,
      description: description ?? null,
      category,
      priority,
      hostel,
      campus,
      room_number: roomNumber ?? null,
      reported_by: reportedBy,
      reported_by_name: resolvedName,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(toTicket(data));
});

// Update ticket
router.patch("/maintenance/:id", async (req, res) => {
  const { status, priority, assignedTo, notes } = req.body;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assignedTo !== undefined) updates.assigned_to = assignedTo;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("maintenance_tickets")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Ticket not found" });
  return res.json(toTicket(data));
});

export default router;
