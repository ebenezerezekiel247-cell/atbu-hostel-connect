import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, Eye, EyeOff, ChevronRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_KEY = "weweme111@";

export default function AdminCreate() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"key" | "form">("key");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [role, setRole] = useState<"admin" | "class_rep">("class_rep");
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleKeySubmit = () => {
    if (keyInput !== ADMIN_KEY) {
      setKeyError("Incorrect key. Access denied.");
      return;
    }
    setKeyError("");
    setPhase("form");
  };

  const handleCreate = async () => {
    if (!name || !regNumber || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, regNumber, email, password, adminKey: ADMIN_KEY, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to create account.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Created</h2>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">{name}</span> can now sign in as{" "}
            <span className="font-medium text-foreground capitalize">
              {role === "class_rep" ? "Class Representative" : "Admin"}
            </span>.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            They can log in immediately using their email and password.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setName("");
                setRegNumber("");
                setEmail("");
                setPassword("");
              }}
            >
              Create Another
            </Button>
            <Button className="flex-1" onClick={() => setLocation("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-foreground leading-tight">ATBU Hostel Connect</div>
            <div className="text-xs text-muted-foreground">Admin / Class Rep Registration</div>
          </div>
        </div>

        {phase === "key" ? (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Enter Access Key</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This page is restricted. Enter the admin key to proceed.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="admin-key">Access Key</Label>
              <div className="relative">
                <Input
                  id="admin-key"
                  type={showKey ? "text" : "password"}
                  placeholder="Enter the secret key"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleKeySubmit()}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(v => !v)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {keyError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-2">
                  {keyError}
                </p>
              )}
            </div>
            <Button className="w-full mt-5 gap-1" onClick={handleKeySubmit}>
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Regular students should use{" "}
              <button className="underline text-primary" onClick={() => setLocation("/signup")}>
                the normal signup page
              </button>
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Create Elevated Account</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choose the role and fill in account details.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {(["class_rep", "admin"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    role === r
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    {r === "class_rep" ? "Class Rep" : "Admin"}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Aminu Musa"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg">Registration Number</Label>
                <Input
                  id="reg"
                  placeholder="e.g. CSC/18/0001"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@atbu.edu.ng"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setPhase("key")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
