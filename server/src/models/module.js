const mongoose = require("mongoose");
 const { Schema } = mongoose;

// Define the schema for Module
 const moduleSchema = new Schema(
 {
 name: {
 type: String,
 required: true,
 },
 key: {
 type: String,
 required: true,
 unique: true,
 },
 parentKey: {
 type: String,
 default: null,
 },
 subparentKey: {
 type: String,
 default: null,
 },
 index: {
 type: Number,
 default: 0,
 },
 icon: {
 type: String,
 default: null,
 },
 description: {
 type: String,
 default: null,
 },
 isActive: {
 type: Boolean,
 default: true,
 },
 platform: {
 type: String,
 enum: ["mobile", "web", "both"],
 default: "both",
 },
 },
 {
 timestamps: true,
 },
 );

// Create the Module model
 const Module = mongoose.model("Module", moduleSchema);

// ═══════════════════════════════════════════════════════════════════
 // Default modules for MIL ERP system
 // platform: "mobile" = Flutter app only
 // "web" = Web admin panel only
 // "both" = Shared across mobile \u0026 web
 // ═══════════════════════════════════════════════════════════════════
 Module.defaultModules = [
 // ─────────────────────────────────────────────────────────────────
 // MOBILE MODULES (Flutter App)
 // Master keys \u0026 submenus used by the mobile permission system
 // ─────────────────────────────────────────────────────────────────

 // 1. Production Management
 {
 name: "Production Management",
 key: "production-management",
 parentKey: null,
 index: 1,
 icon: "production",
 description: "Manage productions, logs, and status",
 platform: "mobile",
 },
 {
 name: "Production Logs",
 key: "production-logs",
 parentKey: "production-management",
 index: 1,
 icon: "file-text",
 description: "Add/Edit/Delete production logs",
 platform: "mobile",
 },

 // 2. Spare Parts / Milling Management
 {
 name: "Milling Management",
 key: "spare-parts-management",
 parentKey: null,
 index: 2,
 icon: "milling",
 description: "Manage spare parts and installations",
 platform: "mobile",
 },
 {
 name: "Installation Handling",
 key: "installation-handling",
 parentKey: "spare-parts-management",
 index: 1,
 icon: "tool",
 description: "Installation handling management",
 platform: "mobile",
 },
 // 3. Electricity Management
 {
 name: "Electricity Management",
 key: "electricity-management",
 parentKey: null,
 index: 3,
 icon: "electricity",
 description: "Manage room, plant, and vehicle readings",
 platform: "mobile",
 },
 {
 name: "Room Reading",
 key: "room-reading",
 parentKey: "electricity-management",
 index: 1,
 icon: "thermometer",
 description: "Room reading listing \u0026 add",
 platform: "mobile",
 },
 {
 name: "Plant Reading",
 key: "plant-reading",
 parentKey: "electricity-management",
 index: 2,
 icon: "factory",
 description: "Plant reading listing \u0026 add",
 platform: "mobile",
 }]