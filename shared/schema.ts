import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, bigint, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey(), // e.g., "INV-500"
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  lastUpdated: bigint("last_updated", { mode: "number" }).notNull(),
  
  // Logic toggles
  shipmentType: varchar("shipment_type", { length: 20 }).notNull().default("with-inspection"),
  forwarder: varchar("forwarder", { length: 20 }).notNull().default("xpo"),
  manualForwarderName: text("manual_forwarder_name").default(""),
  manualMethod: varchar("manual_method", { length: 20 }).default("email"),
  fumigation: varchar("fumigation", { length: 20 }).notNull().default("sky-services"),
  manualFumigationName: text("manual_fumigation_name").default(""),
  manualFumigationMethod: varchar("manual_fumigation_method", { length: 20 }).default("email"),
  
  // Stored as JSON for complex nested data
  details: jsonb("details").notNull().$type<{
    customer: string;
    consignee: string;
    location: string;
    brand: string;
    inspectionDate: string;
    eta: string;
    loadingDate: string;
    idf: string;
    seal: string;
    ucr: string;
    proforma: string;
    commercialInv: string;
    container: string;
    booking: string;
  }>(),
  
  commercial: jsonb("commercial").notNull().$type<{
    invoice: string;
    qty: string;
    netWeight: string;
    grossWeight: string;
  }>(),
  
  actual: jsonb("actual").notNull().$type<{
    invoice: string;
    qty: string;
    netWeight: string;
    grossWeight: string;
    invoiceSent: boolean;
  }>(),
  
  customTasks: jsonb("custom_tasks").notNull().$type<Array<{ id: string; text: string; completed: boolean }>>(),
  documents: jsonb("documents").notNull().$type<Array<{ id: string; name: string; file: string; createdAt: number }>>(),
  checklist: jsonb("checklist").notNull().$type<Record<string, boolean>>(),
});

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  notes: text("notes").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Insert schemas
export const insertShipmentSchema = createInsertSchema(shipments).omit({
  createdAt: true,
  lastUpdated: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
