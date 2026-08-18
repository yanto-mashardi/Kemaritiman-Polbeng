import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }), email: text("email").notNull().unique(),
  name: text("name").notNull(), role: text("role").notNull(), unitId: text("unit_id").notNull().default("UPPS"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
export const kpis = sqliteTable("kpis", {
  id: integer("id").primaryKey({ autoIncrement: true }), code: text("code").notNull().unique(), name: text("name").notNull(),
  category: text("category").notNull(), unitId: text("unit_id").notNull(), target: real("target").notNull(),
  actual: real("actual").notNull(), year: integer("year").notNull(), source: text("source").notNull(),
});
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), type: text("type").notNull(),
  unitId: text("unit_id").notNull(), year: integer("year").notNull(), visibility: text("visibility").notNull(), url: text("url").notNull().default("#"),
});
export const outcomeResults = sqliteTable("outcome_results", {
  id: integer("id").primaryKey({ autoIncrement: true }), programId: text("program_id").notNull(), code: text("code").notNull(),
  name: text("name").notNull(), score: real("score").notNull(), semester: text("semester").notNull(), target: real("target").notNull().default(80),
});
export const repositories = sqliteTable("repositories", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), author: text("author").notNull(),
  year: integer("year").notNull(), type: text("type").notNull(), programId: text("program_id").notNull(), url: text("url").notNull().default("#"),
});
export const laboratories = sqliteTable("laboratories", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), field: text("field").notNull(),
  equipmentCount: integer("equipment_count").notNull(), memberCount: integer("member_count").notNull(), roadmapProgress: real("roadmap_progress").notNull(),
});
export const authCredentials = sqliteTable("auth_credentials", { userId: integer("user_id").primaryKey(), passwordSalt: text("password_salt").notNull(), passwordHash: text("password_hash").notNull() });
export const authSessions = sqliteTable("auth_sessions", { tokenHash: text("token_hash").primaryKey(), userId: integer("user_id").notNull(), expiresAt: integer("expires_at").notNull() });
export const academicRecords = sqliteTable("academic_records", { id: integer("id").primaryKey({ autoIncrement: true }), year: integer("year").notNull(), programId: text("program_id").notNull(), graduated: integer("graduated").notNull(), graduatedOnTime: integer("graduated_on_time").notNull() });
export const tracerRecords = sqliteTable("tracer_records", { id: integer("id").primaryKey({ autoIncrement: true }), year: integer("year").notNull(), programId: text("program_id").notNull(), traced: integer("traced").notNull(), employedWithin6Months: integer("employed_within_6_months").notNull() });
export const laboratoryUsage = sqliteTable("laboratory_usage", { id: integer("id").primaryKey({ autoIncrement: true }), year: integer("year").notNull(), laboratoryId: integer("laboratory_id").notNull(), availableHours: real("available_hours").notNull(), usedHours: real("used_hours").notNull() });
