import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShieldAlert, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    name: "",
    regNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // Step 1 — create Supabase auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Duplicate email — Supabase returns a fake user with no identities
    if ((authData.user.identities ?? []).length === 0) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // Step 2 — create the user profile row
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      name: form.name,
      email: form.email,
      reg_number: form.regNumber.toUpperCase(),
      role: "student",
      campus: null,
      hostel: null,
      room_number: null,
      onboarding_complete: false,
    });

    if (profileError) {
      // Clean up the auth account so the user can retry
      await supabase.auth.signOut();
      if (profileError.code === "23505") {
        setError("Registration number already in use by another account.");
      } else {
        setError(profileError.message);
      }
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, session is already active → go to onboarding
    if (authData.session) {
      setLocation("/onboarding");
      return;
    }

    // Email confirmation is enabled → tell the user to check their inbox
    setError(
      "Almost there! Check your email for a confirmation link, then come back to sign in."
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-foreground leading-tight">
              ATBU Hostel Connect
            </div>
            <div className="text-xs text-muted-foreground">
              Create your student account
            </div>
          </div>
        </div>

        <Card className="border border-card-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create account</CardTitle>
            <CardDescription>
              Use your official ATBU registration number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="signup-name"
                  placeholder="Aminu Garba"
                  value={form.name}
                  onChange={set("name")}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regNumber">Registration Number</Label>
                <Input
                  id="regNumber"
                  data-testid="signup-regnumber"
                  placeholder="e.g. SCI/2021/001"
                  value={form.regNumber}
                  onChange={set("regNumber")}
                  required
                  className="uppercase"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique — one account per registration number
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="signup-email"
                  type="email"
                  placeholder="you@atbu.edu.ng"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  data-testid="signup-confirm-password"
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                data-testid="signup-submit"
                className="w-full gap-2"
                disabled={loading}
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
