import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
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
            <div className="font-bold text-foreground leading-tight">ATBU Hostel Connect</div>
            <div className="text-xs text-muted-foreground">Account recovery</div>
          </div>
        </div>

        <Card className="border border-card-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Reset password</CardTitle>
            <CardDescription>
              Enter your registered email and we'll send a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Email sent</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Check <strong>{email}</strong> for a password reset link.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign in
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    data-testid="forgot-email"
                    type="email"
                    placeholder="you@atbu.edu.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  data-testid="forgot-submit"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  <Mail className="w-4 h-4" />
                  {loading ? "Sending..." : "Send reset link"}
                </Button>

                <Link href="/login">
                  <Button variant="ghost" className="w-full gap-2 mt-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign in
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
