import { pgTable, text, integer, boolean, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["student", "hostel_rep", "admin"]);
export const campusEnum = pgEnum("campus", ["gubi", "yelwa"]);
export const channelTypeEnum = pgEnum("channel_type", ["general", "hostel_rep", "admin", "hostel_specific"]);
export const maintenanceCategoryEnum = pgEnum("maintenance_category", ["plumbing", "electrical", "furniture", "cleaning", "security", "other"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", ["open", "in_progress", "resolved", "closed"]);
export const maintenancePriorityEnum = pgEnum("maintenance_priority", ["low", "medium", "high", "urgent"]);
export const listingTypeEnum = pgEnum("listing_type", ["sell", "buy", "trade"]);
export const listingCategoryEnum = pgEnum("listing_category", ["electronics", "books", "clothing", "food", "furniture", "services", "other"]);
export const listingStatusEnum = pgEnum("listing_status", ["active", "sold", "withdrawn"]);
export const sosStatusEnum = pgEnum("sos_status", ["active", "resolved"]);

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  role: roleEnum("role").notNull().default("student"),
  campus: campusEnum("campus").notNull().default("gubi"),
  hostel: text("hostel").notNull(),
  roomNumber: text("room_number"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ── Channels ──────────────────────────────────────────────────────────────────
export const channelsTable = pgTable("channels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: channelTypeEnum("type").notNull().default("general"),
  campus: text("campus").notNull().default("all"),
  hostel: text("hostel"),
  memberCount: integer("member_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChannelSchema = createInsertSchema(channelsTable).omit({ createdAt: true, memberCount: true, lastMessageAt: true });
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channelsTable.$inferSelect;

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull().references(() => channelsTable.id),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull().default("student"),
  senderAvatarUrl: text("sender_avatar_url"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

// ── Maintenance Tickets ───────────────────────────────────────────────────────
export const maintenanceTicketsTable = pgTable("maintenance_tickets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: maintenanceCategoryEnum("category").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("open"),
  priority: maintenancePriorityEnum("priority").notNull().default("medium"),
  hostel: text("hostel").notNull(),
  campus: campusEnum("campus").notNull(),
  roomNumber: text("room_number"),
  reportedBy: text("reported_by").notNull(),
  reportedByName: text("reported_by_name").notNull(),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaintenanceTicketSchema = createInsertSchema(maintenanceTicketsTable).omit({ createdAt: true, updatedAt: true });
export type InsertMaintenanceTicket = z.infer<typeof insertMaintenanceTicketSchema>;
export type MaintenanceTicket = typeof maintenanceTicketsTable.$inferSelect;

// ── Listings ──────────────────────────────────────────────────────────────────
export const listingsTable = pgTable("listings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  type: listingTypeEnum("type").notNull(),
  category: listingCategoryEnum("category").notNull(),
  status: listingStatusEnum("status").notNull().default("active"),
  sellerId: text("seller_id").notNull(),
  sellerName: text("seller_name").notNull(),
  sellerHostel: text("seller_hostel").notNull(),
  campus: campusEnum("campus").notNull(),
  imageUrl: text("image_url"),
  negotiable: boolean("negotiable").notNull().default(false),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

// ── SOS Alerts ────────────────────────────────────────────────────────────────
export const sosAlertsTable = pgTable("sos_alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  hostel: text("hostel").notNull(),
  campus: campusEnum("campus").notNull(),
  roomNumber: text("room_number"),
  message: text("message"),
  status: sosStatusEnum("status").notNull().default("active"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSosAlertSchema = createInsertSchema(sosAlertsTable).omit({ createdAt: true, resolvedAt: true });
export type InsertSosAlert = z.infer<typeof insertSosAlertSchema>;
export type SosAlert = typeof sosAlertsTable.$inferSelect;
