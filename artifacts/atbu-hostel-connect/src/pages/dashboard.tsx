import { Link } from "wouter";
import { motion } from "framer-motion";
import { MessageSquare, Wrench, ShoppingBag, ShieldAlert, ArrowRight, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useCurrentUser } from "@/hooks/use-current-user";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20 } } },
};

const quickLinks = [
  { path: "/chat", label: "Open Chat", icon: MessageSquare, color: "bg-blue-500/10 text-blue-600 border-blue-100" },
  { path: "/maintenance", label: "Report Issue", icon: Wrench, color: "bg-amber-500/10 text-amber-600 border-amber-100" },
  { path: "/marketplace", label: "Browse Market", icon: ShoppingBag, color: "bg-purple-500/10 text-purple-600 border-purple-100" },
  { path: "/sos", label: "SOS Emergency", icon: ShieldAlert, color: "bg-red-500/10 text-red-600 border-red-100" },
];

function StatCard({ label, value, sub, isLoading }: { label: string; value?: number; sub?: string; isLoading: boolean }) {
  return (
    <motion.div variants={stagger.item}>
      <Card className="border border-card-border shadow-sm">
        <CardContent className="p-5">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground tabular-nums">{value ?? 0}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
              {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const user = useCurrentUser();
  const { data: stats, isLoading } = useGetDashboardStats();

  const campusLabel =
    user.campus === "gubi" ? "Gubi Campus" : user.campus === "yelwa" ? "Yelwa Campus" : "";

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="dashboard-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {campusLabel && (
            <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30 bg-primary/5">
              {campusLabel}
            </Badge>
          )}
          {user.hostel && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {user.hostel}{user.roomNumber ? ` · Room ${user.roomNumber}` : ""}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs text-muted-foreground capitalize">
            {user.role.replace("_", " ")}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening in your hostel today.
        </p>
      </motion.div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard label="Open Tickets" value={stats?.openTickets} isLoading={isLoading} sub="maintenance requests" />
        <StatCard label="Active Listings" value={stats?.activeListings} isLoading={isLoading} sub="on marketplace" />
        <StatCard label="Active Alerts" value={stats?.activeAlerts} isLoading={isLoading} sub="SOS emergencies" />
        <StatCard label="Chat Channels" value={stats?.channelCount} isLoading={isLoading} sub="discussion groups" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {quickLinks.map(({ path, label, icon: Icon, color }) => (
              <motion.div key={path} variants={stagger.item}>
                <Link href={path}>
                  <div
                    data-testid={`quicklink-${label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`group flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${color} bg-opacity-50`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <Card className="border border-card-border shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
