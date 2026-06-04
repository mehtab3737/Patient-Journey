import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PatientSearchResult } from "@/lib/types";

// GET /api/patient/search?q=query
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ patients: [] });
  }

  // Search by name (ILIKE) or exact UUID match
  const isUuid = /^[0-9a-f-]{36}$/i.test(q);

  let query = supabase
    .from("patients")
    .select("id, name, medical_condition, gender, date_of_birth")
    .limit(10);

  if (isUuid) {
    query = query.eq("id", q);
  } else {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: patients, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ patients: patients as PatientSearchResult[] });
}
