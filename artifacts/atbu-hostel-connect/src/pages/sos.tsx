import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, Clock, Phone, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetActiveSosAlerts,
  useTriggerSos,
  useResolveSosAlert,
  getGetActiveSosAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthContext } from "@/context/auth-context";

const safetyTips = [
  "Stay calm and remain in your room if possible",
  "Contact your hostel rep immediately for non-life-threatening issues",
  "The campus security office is available 24/7",
  "Emergency number: 070-000-0000 (Campus Security)",
  "Assembly points are marked on hostel notice boards",
];

export default function Sos() {
  const user = useCurrentUser();
  const { session } = useAuthContext();
  const qc = useQueryClient();
  const [triggered, setTriggered] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isElevated = ["admin", "class_rep"].includes(user.role);
  const token = session?.access_token ?? "";

  const triggerSos = useTriggerSos();
  const resolveSos = useResolveSosAlert();
  const { data: activeAlerts, isLoading: alertsLoading } = useGetActiveSosAlerts();

  const deleteSos = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete alert");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetActiveSosAlertsQueryKey() });
      setConfirmDeleteId(null);
    },
  });

  const handleTrigger = () => {
    triggerSos.mutate(
      {
        data: {
          userId: user.id,
          hostel: user.hostel,
          campus: user.campus,
          roomNumber: user.roomNumber ?? undefined,
          message: message || undefined,
        },
      },
      {
        onSuccess: () => {
          setTriggered(true);
          setConfirming(false);
          setMessage("");
          qc.invalidateQueries({ queryKey: getGetActiveSosAlertsQueryKey() });
        },
      }
    );
  };

  const handleResolve = (id: string) => {
    resolveSos.mutate(
      { id },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetActiveSosAlertsQueryKey() }) }
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" data-testid="sos-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">SOS Emergency</h1>
        <p className="text-muted-foreground text-sm mt-1">
          For emergencies requiring immediate campus security response
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* SOS trigger panel */}
        <div className="lg:col-span-3">
          <Card className="border border-card-border shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                {triggered ? (
                  <motion.div
                    key="triggered"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
                    >
                      <ShieldCheck className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Alert Sent</h2>
                    <p className="text-muted-foreground text-sm mb-2">
                      Campus security has been notified. Help is on the way.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.hostel} · Room {user.roomNumber}
                    </p>
                    <Button
                      data-testid="reset-sos-btn"
                      variant="outline"
                      className="mt-6"
                      onClick={() => setTriggered(false)}
                    >
                      Send Another Alert
                    </Button>
                  </motion.div>
                ) : confirming ? (
                  <motion.div
                    key="confirming"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Confirm Emergency Alert</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will alert campus security and your hostel rep immediately.
                    </p>
                    <Textarea
                      data-testid="sos-message-input"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Optional: Describe the emergency (e.g. fire, medical, intruder)..."
                      rows={3}
                      className="mb-4 text-sm"
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirming(false)}
                        data-testid="cancel-sos-btn"
                      >
                        Cancel
                      </Button>
                      <Button
                        data-testid="confirm-sos-btn"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleTrigger}
                        disabled={triggerSos.isPending}
                      >
                        {triggerSos.isPending ? "Sending..." : "Send Alert Now"}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <motion.button
                      data-testid="sos-trigger-btn"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setConfirming(true)}
                      className="w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-12 h-12 text-white mb-1" />
                      <span className="text-white font-bold text-sm tracking-wider">SOS</span>
                    </motion.button>
                    <h2 className="text-lg font-bold text-foreground mb-1">Emergency Alert</h2>
                    <p className="text-sm text-muted-foreground">
                      Press the button above to alert campus security
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground/70 bg-muted/50 rounded-lg px-4 py-2">
                      Location: {user.hostel}, Room {user.roomNumber} ·{" "}
                      {user.campus === "gubi" ? "Gubi" : "Yelwa"} Campus
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Safety tips */}
          <Card className="border border-card-border shadow-sm mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {safetyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Active alerts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Active Alerts</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/60">Last 3 days</span>
              {activeAlerts && activeAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">{activeAlerts.length}</Badge>
              )}
            </div>
          </div>
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="border border-card-border shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeAlerts && activeAlerts.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {activeAlerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <Card
                      data-testid={`alert-${alert.id}`}
                      className="border border-red-200 bg-red-50/50 shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">{alert.userName}</p>
                            <p className="text-xs text-red-600/80">
                              {alert.hostel}{alert.roomNumber && ` · Room ${alert.roomNumber}`}
                            </p>
                          </div>
                        </div>
                        {alert.message && (
                          <p className="text-xs text-foreground bg-white/60 rounded px-2.5 py-1.5 mb-2 border border-red-100">
                            {alert.message}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {isElevated && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                data-testid={`resolve-alert-${alert.id}`}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => handleResolve(alert.id)}
                                disabled={resolveSos.isPending}
                              >
                                Resolve
                              </Button>
                              {confirmDeleteId === alert.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    disabled={deleteSos.isPending}
                                    onClick={() => deleteSos.mutate(alert.id)}
                                  >
                                    {deleteSos.isPending ? "Deleting..." : "Confirm Fake"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => setConfirmDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  data-testid={`delete-alert-${alert.id}`}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => setConfirmDeleteId(alert.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Fake
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="border border-card-border shadow-sm">
              <CardContent className="py-10 text-center">
                <ShieldCheck className="w-10 h-10 text-green-500/50 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">All clear</p>
                <p className="text-xs text-muted-foreground/70 mt-1">No active alerts in the last 3 days</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
