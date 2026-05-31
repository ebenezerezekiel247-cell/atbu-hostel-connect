import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// POST /api/auth/signup
// Uses the admin API to create users without needing email confirmation or SMTP setup.
router.post("/auth/signup", async (req, res) => {
  const { name, email, password, regNumber } = req.body;

  if (!name || !email || !password || !regNumber) {
    return res.status(400).json({ error: "name, email, password, and regNumber are required" });
  }

  // Create auth user with admin API — email_confirm: true skips the confirmation email entirely
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already been registered") ||
        authError.message.toLowerCase().includes("already exists")) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return res.status(500).json({ error: authError.message });
  }

  const userId = authData.user.id;

  // Create profile row — unique reg_number enforced by DB constraint
  const { error: profileError } = await supabase.from("users").insert({
    id: userId,
    name,
    email,
    reg_number: regNumber.toUpperCase(),
    role: "student",
    campus: null,
    hostel: null,
    room_number: null,
    onboarding_complete: false,
  });

  if (profileError) {
    // Roll back the auth user so re-signup is possible
    await supabase.auth.admin.deleteUser(userId);

    if (profileError.code === "23505") {
      return res.status(409).json({ error: "Registration number already in use by another account" });
    }
    return res.status(500).json({ error: profileError.message });
  }

  return res.status(201).json({ message: "Account created. You can now sign in." });
});

export default router;
