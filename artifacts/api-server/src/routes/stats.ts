import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/stats/dashboard", async (_req, res) => {
  const [ticketsRes, listingsRes, alertsRes, channelsRes, messagesRes] =
    await Promise.all([
      supabase
        .from("maintenance_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("sos_alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("channels")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("messages")
        .select("content, created_at, sender_name")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const recentActivity = (messagesRes.data ?? []).map((m) => ({
    type: "message",
    description: `New message from ${m.sender_name}`,
    createdAt: m.created_at,
  }));

  return res.json({
    openTickets: ticketsRes.count ?? 0,
    activeListings: listingsRes.count ?? 0,
    activeAlerts: alertsRes.count ?? 0,
    channelCount: channelsRes.count ?? 0,
    recentActivity,
  });
});

export default router;
