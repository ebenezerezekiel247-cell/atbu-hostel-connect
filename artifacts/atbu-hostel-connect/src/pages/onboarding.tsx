import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ChevronRight, Building2, MapPin, Hash, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/auth-context";
import { HOSTEL_GROUPS, getHostelGroupsForCampus, type Campus } from "@/lib/hostels";

const steps = ["Campus", "Hostel", "Room"];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { session, refreshProfile } = useAuthContext();
  const [step, setStep] = useState(0);
  const [campus, setCampus] = useState<Campus | "">("");
  const [hostel, setHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hostelGroups = campus ? getHostelGroupsForCampus(campus as Campus) : [];

  const handleComplete = async () => {
    if (!campus || !hostel) return;
    setError(null);
    setLoading(true);

    const userId = session?.user.id;
    const token = session?.access_token;

    if (!userId || !token) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        campus,
        hostel,
        roomNumber: roomNumber || undefined,
        onboardingComplete: true,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to save. Please try again.");
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLocation("/");
  };

  const canAdvance =
    (step === 0 && campus !== "") ||
    (step === 1 && hostel !== "") ||
    step === 2;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-foreground leading-tight">ATBU Hostel Connect</div>
            <div className="text-xs text-muted-foreground">Set up your profile</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="campus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-1">Which campus are you on?</h2>
              <p className="text-sm text-muted-foreground mb-5">Select your ATBU campus</p>
              <div className="grid grid-cols-2 gap-3">
                {(["gubi", "yelwa"] as Campus[]).map(c => (
                  <button
                    key={c}
                    data-testid={`campus-${c}`}
                    onClick={() => { setCampus(c); setHostel(""); }}
                    className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      campus === c
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <MapPin className="w-6 h-6" />
                    <span className="font-semibold capitalize">{c}</span>
                    <span className="text-xs text-muted-foreground">Campus</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="hostel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-1">Which hostel are you in?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Select your hostel on{" "}
                <span className="font-medium capitalize">{campus} Campus</span>
              </p>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {hostelGroups.map(group => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.hostels.map(h => (
                        <button
                          key={h}
                          data-testid={`hostel-${h}`}
                          onClick={() => setHostel(h)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                            hostel === h
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="room"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-1">What's your room number?</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Optional — you can update this later
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
                <p className="text-xs text-amber-700">
                  Your room number is locked for 90 days after you set it. Choose carefully.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room">Room Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="room"
                    data-testid="onboarding-room"
                    placeholder="e.g. B12, 204, A05"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">Your selection</p>
                <p>Campus: <span className="font-medium capitalize text-foreground">{campus}</span></p>
                <p>Hostel: <span className="font-medium text-foreground">{hostel}</span></p>
                {roomNumber && (
                  <p>Room: <span className="font-medium text-foreground">{roomNumber}</span></p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3">
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
              data-testid="onboarding-back"
            >
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              className="flex-1 gap-1"
              disabled={!canAdvance}
              onClick={() => setStep(s => s + 1)}
              data-testid="onboarding-next"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2"
              onClick={handleComplete}
              disabled={loading || !campus || !hostel}
              data-testid="onboarding-complete"
            >
              {loading ? "Saving..." : "Complete setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
