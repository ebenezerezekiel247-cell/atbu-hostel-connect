import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

function toUser(u: Record<string, unknown>) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    reg_number: u.reg_number,
    role: u.role,
    campus: u.campus,
    hostel: u.hostel,
    room_number: u.room_number,
    room_updated_at: u.room_updated_at,
    onboarding_complete: u.onboarding_complete,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
  };
}

async function requireAdmin(req: Parameters<Parameters<typeof router.use>[0]>[0], res: Parameters<Parameters<typeof router.use>[0]>[1]) {
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

// GET /api/admin/users — list users with optional filters (hostel, campus, search)
router.get("/admin/users", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (req.query.hostel) query = query.eq("hostel", req.query.hostel as string);
  if (req.query.campus) query = query.eq("campus", req.query.campus as string);
  if (req.query.q) {
    query = query.or(
      `name.ilike.%${req.query.q}%,reg_number.ilike.%${req.query.q}%`
    );
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toUser));
});

// PATCH /api/admin/users/:id/evict — remove user from room (bypasses 90-day lock)
router.patch("/admin/users/:id/evict", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { data, error } = await supabase
    .from("users")
    .update({ room_number: null, room_updated_at: null })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "User not found" });
  return res.json(toUser(data));
});

// DELETE /api/admin/listings/:id — force-delete a marketplace listing
router.delete("/admin/listings/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

export default router;
