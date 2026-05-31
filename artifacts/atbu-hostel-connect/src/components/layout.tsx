import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, MessageSquare, Wrench, ShoppingBag, ShieldAlert,
  Menu, X, LogOut, User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthContext } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { useGetActiveSosAlerts } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { path: "/sos", label: "SOS", icon: ShieldAlert, danger: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useCurrentUser();
  const { signOut, session } = useAuthContext();
  const { toast } = useToast();
  const { data: activeAlerts } = useGetActiveSosAlerts();
  const alertCount = activeAlerts?.length ?? 0;

  // Supabase Realtime — SOS broadcast to all logged-in clients
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("sos-broadcast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as { type: string; title: string; body: string };
          if (notif.type === "sos_alert") {
            toast({
              title: notif.title,
              description: notif.body,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, toast]);

  const campusLabel = user.campus === "gubi" ? "Gubi Campus" : user.campus === "yelwa" ? "Yelwa Campus" : "";

  const NavItem = ({
    path, label, icon: Icon, danger, onClick,
  }: {
    path: string; label: string; icon: typeof LayoutDashboard; danger?: boolean; onClick?: () => void;
  }) => {
    const active = location === path;
    return (
      <Link href={path}>
        <div
          data-testid={`nav-${label.toLowerCase()}`}
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
            active
              ? danger
                ? "bg-destructive/10 text-destructive"
                : "bg-sidebar-accent text-sidebar-primary"
              : danger
              ? "text-destructive/80 hover:bg-destructive/5 hover:text-destructive"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{label}</span>
          {label === "SOS" && alertCount > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0 h-5">
              {alertCount}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground leading-tight">ATBU Hostel</div>
              <div className="text-xs text-muted-foreground leading-tight">Connect</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" data-testid="sidebar-nav">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground">{campusLabel}</div>
            </div>
          </div>
          <button
            data-testid="sign-out-btn"
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-sidebar-foreground">ATBU Hostel Connect</span>
        </div>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-sidebar border-r border-sidebar-border pt-14"
            >
              <nav className="px-3 py-4 space-y-0.5">
                {navItems.map((item) => (
                  <NavItem
                    key={item.path}
                    {...item}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
              <div className="px-3 border-t border-sidebar-border pt-3">
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">{children}</main>
    </div>
  );
}
