import { shipments, notes, type Shipment, type InsertShipment, type Note, type InsertNote } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Shipment operations
  getAllShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined>;
  deleteShipment(id: string): Promise<boolean>;
  
  // Note operations
  getAllNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Shipment operations
  async getAllShipments(): Promise<Shipment[]> {
    return await db.select().from(shipments).orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment || undefined;
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const now = Date.now();
    const [created] = await db
      .insert(shipments)
      .values({
        ...shipment,
        createdAt: now,
        lastUpdated: now,
      } as any)
      .returning();
    return created;
  }

  async updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const [updated] = await db
      .update(shipments)
      .set({
        ...shipment,
        lastUpdated: Date.now(),
      } as any)
      .where(eq(shipments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteShipment(id: string): Promise<boolean> {
    const result = await db.delete(shipments).where(eq(shipments.id, id)).returning();
    return result.length > 0;
  }

  // Note operations
  async getAllNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [created] = await db
      .insert(notes)
      .values({
        ...note,
        createdAt: Date.now(),
      })
      .returning();
    return created;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const [updated] = await db
      .update(notes)
      .set(note)
      .where(eq(notes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
