#!/usr/bin/env node
/**
 * Patient Records Seed Script
 * Reads hospital_records_2021_2024_with_bills.csv and bulk-inserts into Supabase.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requirements:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   Run: npm install @supabase/supabase-js papaparse dotenv
 */

import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CSV_PATH = path.join(__dirname, "../hospital_records_2021_2024_with_bills.csv");

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
  const d = new Date(dateStr.trim());
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function parseAmount(amountStr) {
  if (!amountStr || amountStr.trim() === "") return null;
  const val = parseFloat(amountStr.replace(/[^0-9.-]/g, ""));
  return isNaN(val) ? null : val;
}

async function seed() {
  console.log("📂  Reading CSV file...");
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");

  const { data: rows, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length > 0) {
    console.warn("⚠️  Parse warnings:", errors.slice(0, 5));
  }

  console.log(`📋  Parsed ${rows.length} records. Starting upsert...`);

  const BATCH_SIZE = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
      id: row["Patient ID"]?.trim(),
      name: row["Name"]?.trim() || "Unknown",
      date_of_birth: parseDate(row["Date of Birth"]),
      gender: row["Gender"]?.trim() || null,
      medical_condition: row["Medical Condition"]?.trim() || null,
      treatments: row["Treatments"]?.trim() || null,
      doctors_notes: row["Doctor's Notes"]?.trim() || null,
      admit_date: parseDate(row["Admit Date"]),
      discharge_date: parseDate(row["Discharge Date"]),
      bill_amount: parseAmount(row["Bill Amount"]),
      current_status: null,
      additional_conditions: [],
      additional_notes: null,
    })).filter((r) => r.id && r.id.length > 0);

    const { error } = await supabase
      .from("patients")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`❌  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`✅  Inserted ${inserted}/${rows.length} records...\r`);
    }
  }

  console.log(`\n\n🎉  Seed complete! Inserted: ${inserted} | Failed: ${failed}`);
}

seed().catch((err) => {
  console.error("💥  Seed script crashed:", err);
  process.exit(1);
});
