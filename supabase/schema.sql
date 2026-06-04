-- =============================================
-- Patient Journey AI Chatbot - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- ============ PATIENTS TABLE ============
create table if not exists public.patients (
  id uuid primary key,
  name text not null,
  date_of_birth date,
  gender text,
  medical_condition text,
  treatments text,
  doctors_notes text,
  admit_date date,
  discharge_date date,
  bill_amount numeric(12, 2),
  -- Extended mutable fields (doctor-driven updates)
  current_status text,
  additional_conditions text[] default '{}',
  additional_notes text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes for common searches
create index if not exists idx_patients_name on public.patients using gin(to_tsvector('english', name));
create index if not exists idx_patients_condition on public.patients (medical_condition);

-- RLS: authenticated doctors can read all patients
alter table public.patients enable row level security;

drop policy if exists "Authenticated can read patients" on public.patients;
create policy "Authenticated can read patients"
  on public.patients for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated can update patients" on public.patients;
create policy "Authenticated can update patients"
  on public.patients for update
  using (auth.role() = 'authenticated');

-- ============ CONVERSATIONS TABLE ============
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conversations_doctor on public.conversations (doctor_id);
create index if not exists idx_conversations_patient on public.conversations (patient_id);

alter table public.conversations enable row level security;

drop policy if exists "Doctors can manage own conversations" on public.conversations;
create policy "Doctors can manage own conversations"
  on public.conversations for all
  using (auth.uid() = doctor_id);

-- ============ MESSAGES TABLE ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Doctors can manage own messages" on public.messages;
create policy "Doctors can manage own messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.doctor_id = auth.uid()
    )
  );

-- ============ DOCTOR PROFILES TABLE ============
-- Stores additional profile info beyond Supabase Auth
create table if not exists public.doctor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  specialty text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.doctor_profiles enable row level security;

drop policy if exists "Doctors can read all profiles" on public.doctor_profiles;
create policy "Doctors can read all profiles"
  on public.doctor_profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "Doctors can update own profile" on public.doctor_profiles;
create policy "Doctors can update own profile"
  on public.doctor_profiles for all
  using (auth.uid() = id);

-- Auto-create doctor profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.doctor_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
