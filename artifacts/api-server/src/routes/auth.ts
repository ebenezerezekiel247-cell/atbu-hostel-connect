import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

const ADMIN_KEY = "weweme111@";
const ALLOWED_ELEVATED_ROLES = ["admin", "class_rep"] as const;

// POST /api/auth/signup
// Uses the admin API to create users without email confirmation.
// Pass adminKey + role to create elevated accounts (admin / class_rep).
router.post("/auth/signup", async (req, res) => {
  const { name, email, password, regNumber, adminKey, role } = req.body;

  if (!name || !email || !password || !regNumber) {
    return res
      .status(400)
      .json({ error: "name, email, password, and regNumber are required" });
  }

  // Determine role — elevated only if correct secret key is provided
  let assignedRole = "student";
  if (adminKey && role) {
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: "Invalid admin key" });
    }
    if (!ALLOWED_ELEVATED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    assignedRole = role;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    console.error("[signup] auth.admin.createUser error:", JSON.stringify(authError));
    const msg = authError.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("already exists") ||
      msg.includes("user already")
    ) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return res.status(500).json({ error: authError.message });
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from("users").insert({
    id: userId,
    name,
    email,
    reg_number: regNumber.toUpperCase(),
    role: assignedRole,
    campus: null,
    hostel: null,
    room_number: null,
    onboarding_complete: false,
  });

  if (profileError) {
    console.error("[signup] profile insert error:", JSON.stringify(profileError));
    await supabase.auth.admin.deleteUser(userId);
    if (profileError.code === "23505") {
      return res
        .status(409)
        .json({ error: "Registration number already in use by another account" });
    }
    return res.status(500).json({ error: profileError.message });
  }

  return res.status(201).json({ message: "Account created. You can now sign in." });
});

export default router;
