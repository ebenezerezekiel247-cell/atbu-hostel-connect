import { Router } from "express";
import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

const router = Router();

function toChannel(c: Record<string, unknown>) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    type: c.type,
    campus: c.campus,
    hostel: c.hostel ?? null,
    memberCount: c.member_count,
    lastMessageAt: c.last_message_at ?? null,
    createdAt: c.created_at,
  };
}

function toMessage(m: Record<string, unknown>) {
  return {
    id: m.id,
    channelId: m.channel_id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role,
    senderAvatarUrl: m.sender_avatar_url ?? null,
    content: m.content,
    createdAt: m.created_at,
  };
}

// List channels
router.get("/channels", async (_req, res) => {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toChannel));
});

// Create channel
router.post("/channels", async (req, res) => {
  const { name, description, type, campus, hostel } = req.body;
  if (!name || !type || !campus) {
    return res.status(400).json({ error: "name, type, campus are required" });
  }

  const { data, error } = await supabase
    .from("channels")
    .insert({ id: randomUUID(), name, description, type, campus, hostel: hostel ?? null })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(toChannel(data));
});

// Get channel
router.get("/channels/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Channel not found" });
  return res.json(toChannel(data));
});

// Get channel messages
router.get("/channels/:channelId/messages", async (req, res) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", req.params.channelId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).reverse().map(toMessage));
});

// Send message
router.post("/channels/:channelId/messages", async (req, res) => {
  const { channelId } = req.params;
  const { content, senderId, senderName, senderRole } = req.body;

  if (!content || !senderId) {
    return res.status(400).json({ error: "content and senderId are required" });
  }

  let resolvedName = senderName ?? senderId;
  if (!senderName) {
    const { data: user } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", senderId)
      .single();
    if (user) resolvedName = user.name;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      sender_id: senderId,
      sender_name: resolvedName,
      sender_role: senderRole ?? "student",
      content,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from("channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", channelId);

  return res.status(201).json(toMessage(data));
});

export default router;
