import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

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

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).json({ error: "User not found" });
  return res.json(toUser(data));
});

// POST /api/users — create profile after Supabase signup
router.post("/users", async (req, res) => {
  const { id, name, email, regNumber } = req.body;

  if (!id || !name || !regNumber) {
    return res.status(400).json({ error: "id, name, and regNumber are required" });
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id,
      name,
      email: email ?? null,
      reg_number: regNumber,
      role: "student",
      campus: null,
      hostel: null,
      room_number: null,
      onboarding_complete: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Registration number already in use" });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(toUser(data));
});

// PATCH /api/users/:id — update profile with room-number time-lock
router.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const isUpdatingRoom =
    body.roomNumber !== undefined || body.room_number !== undefined;

  if (isUpdatingRoom) {
    const { data: existing } = await supabase
      .from("users")
      .select("room_updated_at")
      .eq("id", id)
      .single();

    if (existing?.room_updated_at) {
      const elapsed =
        Date.now() - new Date(existing.room_updated_at as string).getTime();
      if (elapsed < NINETY_DAYS_MS) {
        const unlockDate = new Date(
          new Date(existing.room_updated_at as string).getTime() + NINETY_DAYS_MS
        ).toISOString();
        return res.status(403).json({
          error: "Room number is locked. You can only change it once every 90 days.",
          unlockDate,
        });
      }
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.campus !== undefined) updates.campus = body.campus;
  if (body.hostel !== undefined) updates.hostel = body.hostel;
  if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;
  if (body.onboardingComplete !== undefined)
    updates.onboarding_complete = body.onboardingComplete;
  if (isUpdatingRoom) {
    updates.room_number = body.roomNumber ?? body.room_number;
    updates.room_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "User not found" });

  return res.json(toUser(data));
});

export default router;
