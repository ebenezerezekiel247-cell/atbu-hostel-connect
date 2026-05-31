import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

function toListing(l: Record<string, unknown>) {
  return {
    id: l.id,
    title: l.title,
    description: l.description ?? null,
    price: Number(l.price),
    type: l.type,
    category: l.category,
    status: l.status,
    sellerId: l.seller_id,
    sellerName: l.seller_name,
    sellerHostel: l.seller_hostel,
    campus: l.campus,
    imageUrl: l.image_url ?? null,
    negotiable: l.negotiable,
    contactInfo: l.contact_info ?? null,
    createdAt: l.created_at,
  };
}

// List listings
router.get("/listings", async (req, res) => {
  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (req.query.type) query = query.eq("type", req.query.type as string);
  if (req.query.category)
    query = query.eq("category", req.query.category as string);
  if (req.query.q)
    query = query.ilike("title", `%${req.query.q as string}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toListing));
});

// Featured listings
router.get("/listings/featured", async (_req, res) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toListing));
});

// Get single listing
router.get("/listings/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data)
    return res.status(404).json({ error: "Listing not found" });
  return res.json(toListing(data));
});

// Create listing
router.post("/listings", async (req, res) => {
  const {
    title,
    description,
    price,
    type,
    category,
    sellerId,
    campus,
    contactInfo,
    negotiable,
  } = req.body;

  if (!title || price === undefined || !type || !category || !sellerId || !campus) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let sellerName = sellerId;
  let sellerHostel = "";

  const { data: user } = await supabase
    .from("users")
    .select("name, hostel")
    .eq("id", sellerId)
    .single();
  if (user) {
    sellerName = user.name;
    sellerHostel = user.hostel ?? "";
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title,
      description: description ?? null,
      price,
      type,
      category,
      seller_id: sellerId,
      seller_name: sellerName,
      seller_hostel: sellerHostel,
      campus,
      contact_info: contactInfo ?? null,
      negotiable: negotiable ?? false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(toListing(data));
});

// Update listing
router.patch("/listings/:id", async (req, res) => {
  const { status } = req.body;
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Listing not found" });
  return res.json(toListing(data));
});

// Delete listing
router.delete("/listings/:id", async (req, res) => {
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

export default router;
