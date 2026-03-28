-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  AKUAFO AI — COMPLETE SUPABASE PRODUCTION SCHEMA                 ║
-- ║  Copy this ENTIRE file and run in:                               ║
-- ║    Supabase Dashboard → SQL Editor → New query → Paste → Run     ║
-- ║  Safe to re-run: drops everything first, then recreates.         ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════
-- SECTION 0: Extensions
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";   -- fast text search

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: DROP EVERYTHING (order respects foreign keys)
-- ═══════════════════════════════════════════════════════════════

-- Drop tables first (CASCADE removes their triggers + policies automatically)
drop table if exists public.revision_items     cascade;
drop table if exists public.check_in_responses cascade;
drop table if exists public.session_progress   cascade;
drop table if exists public.session_annotations cascade;
drop table if exists public.session_messages   cascade;
drop table if exists public.session_materials  cascade;
drop table if exists public.session_members    cascade;
drop table if exists public.study_sessions     cascade;
drop table if exists public.deck_cards         cascade;
drop table if exists public.decks              cascade;
drop table if exists public.study_notes        cascade;
drop table if exists public.practice_attempts  cascade;
drop table if exists public.tutor_sessions     cascade;
drop table if exists public.usage_events       cascade;
drop table if exists public.student_profiles   cascade;
drop table if exists public.topics             cascade;
drop table if exists public.subjects           cascade;

-- Drop the trigger on auth.users (this table always exists in Supabase)
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions
drop function if exists public.handle_new_user()     cascade;
drop function if exists public.touch_updated_at()     cascade;
drop function if exists public.generate_user_id()     cascade;
drop function if exists public.generate_session_id()  cascade;
drop function if exists public.generate_deck_id()     cascade;
drop function if exists public.dashboard_summary(uuid) cascade;
drop function if exists public.leaderboard(int)        cascade;

-- Drop sequences
drop sequence if exists public.user_id_seq;
drop sequence if exists public.session_id_seq;
drop sequence if exists public.deck_id_seq;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: Sequences + ID generators
-- Human-readable IDs: USR00001, SES00001, DCK00001
-- ═══════════════════════════════════════════════════════════════

create sequence public.user_id_seq    start 1;
create sequence public.session_id_seq start 1;
create sequence public.deck_id_seq    start 1;

create or replace function public.generate_user_id()
returns text language sql as $$
  select 'USR' || lpad(nextval('public.user_id_seq')::text, 5, '0');
$$;

create or replace function public.generate_session_id()
returns text language sql as $$
  select 'SES' || lpad(nextval('public.session_id_seq')::text, 5, '0');
$$;

create or replace function public.generate_deck_id()
returns text language sql as $$
  select 'DCK' || lpad(nextval('public.deck_id_seq')::text, 5, '0');
$$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: Tables — Student Profiles & Curriculum
-- ═══════════════════════════════════════════════════════════════

create table public.student_profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_id       text unique not null default public.generate_user_id(),
  display_name     text,
  email            text,
  avatar           text default '🎓',
  school_name      text,
  school_level     text check (school_level in ('BECE','WASSCE')),
  primary_subjects text[] default '{}',
  exam_date        date,
  language_pref    text default 'en' check (language_pref in ('en','twi')),
  onboarded        boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table public.subjects (
  id      serial primary key,
  name    text unique not null,
  emoji   text default '',
  levels  text[] not null default '{}'
);

create table public.topics (
  id         serial primary key,
  subject_id int  not null references public.subjects(id) on delete cascade,
  name       text not null,
  level      text check (level in ('BECE','WASSCE')),
  unique(subject_id, name)
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: Tables — AI Tutor
-- ═══════════════════════════════════════════════════════════════

create table public.tutor_sessions (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  user_id      uuid references public.student_profiles(id) on delete set null,
  subject      text not null,
  level        text not null,
  topic        text,
  question     text not null,
  tutor_output jsonb,
  language     text default 'english',
  created_at   timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: Tables — Practice & Marking
-- ═══════════════════════════════════════════════════════════════

create table public.practice_attempts (
  id             uuid primary key default gen_random_uuid(),
  session_id     text not null,
  user_id        uuid references public.student_profiles(id) on delete set null,
  subject        text not null,
  level          text not null,
  topic          text,
  question       text not null,
  student_answer text,
  marker_output  jsonb,
  is_correct     boolean not null default false,
  created_at     timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: Tables — Practice Decks & Spaced Repetition Cards
-- ═══════════════════════════════════════════════════════════════

create table public.decks (
  id              uuid primary key default gen_random_uuid(),
  display_id      text unique not null default public.generate_deck_id(),
  user_id         uuid not null references public.student_profiles(id) on delete cascade,
  title           text not null,
  subject         text not null,
  level           text not null check (level in ('BECE','WASSCE')),
  description     text,
  source_material text,
  card_count      int default 0,
  created_at      timestamptz default now(),
  last_studied_at timestamptz,
  updated_at      timestamptz default now()
);

create table public.deck_cards (
  id               uuid primary key default gen_random_uuid(),
  deck_id          uuid not null references public.decks(id) on delete cascade,
  card_type        text not null check (card_type in ('flashcard','mcq','fill_blank')),
  front            text not null,
  back             text not null,
  options          text[],
  ease_factor      real default 2.5,
  interval_days    int default 0,
  repetitions      int default 0,
  next_review_at   timestamptz default now(),
  last_reviewed_at timestamptz,
  created_at       timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: Tables — Study Notes
-- ═══════════════════════════════════════════════════════════════

create table public.study_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.student_profiles(id) on delete cascade,
  subject    text not null,
  topic      text default 'General',
  note       text not null,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: Tables — Analytics / Usage Events
-- ═══════════════════════════════════════════════════════════════

create table public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  event_type text not null,
  subject    text,
  level      text,
  language   text,
  user_id    uuid references public.student_profiles(id) on delete set null,
  metadata   jsonb default '{}',
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 9: Tables — Group Study Sessions
-- ═══════════════════════════════════════════════════════════════

create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  display_id       text unique not null default public.generate_session_id(),
  creator_id       uuid not null references public.student_profiles(id) on delete cascade,
  title            text not null,
  course           text not null,
  level            text not null check (level in ('BECE','WASSCE')),
  topics           text[] default '{}',
  invite_code      text unique not null,
  is_public        boolean default true,
  minutes_per_page int default 3,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz default now()
);

create table public.session_members (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.study_sessions(id) on delete cascade,
  user_id         uuid not null references public.student_profiles(id) on delete cascade,
  role            text default 'member' check (role in ('creator','member')),
  speed_override  int,
  joined_at       timestamptz default now(),
  unique(session_id, user_id)
);

create table public.session_materials (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.study_sessions(id) on delete cascade,
  title       text not null,
  body        text not null,
  pages       int default 1,
  file_url    text,
  uploaded_by uuid references public.student_profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.session_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id    uuid references public.student_profiles(id) on delete set null,
  author     text not null,
  body       text not null,
  created_at timestamptz default now()
);

create table public.session_annotations (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.study_sessions(id) on delete cascade,
  material_id uuid not null references public.session_materials(id) on delete cascade,
  user_id     uuid references public.student_profiles(id) on delete set null,
  author      text not null,
  page        int not null default 1,
  body        text not null,
  created_at  timestamptz default now()
);

create table public.session_progress (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.study_sessions(id) on delete cascade,
  user_id      uuid not null references public.student_profiles(id) on delete cascade,
  material_id  uuid not null references public.session_materials(id) on delete cascade,
  current_page int default 1,
  updated_at   timestamptz default now(),
  unique(session_id, user_id, material_id)
);

create table public.check_in_responses (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id    uuid not null references public.student_profiles(id) on delete cascade,
  status     text not null check (status in ('on_track','struggling','ahead')),
  note       text,
  due_at     timestamptz not null,
  created_at timestamptz default now()
);

create table public.revision_items (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.study_sessions(id) on delete cascade,
  user_id       uuid references public.student_profiles(id) on delete set null,
  topic         text not null,
  easiness      real default 2.5,
  interval_days int default 0,
  repetitions   int default 0,
  next_review_at timestamptz default now(),
  created_at    timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 9B: GRANT permissions to Supabase roles
-- Without these, RLS policies have no effect because the roles
-- cannot access the tables at all (PostgreSQL 42501 errors).
-- ═══════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;

grant all on all tables    in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

alter default privileges in schema public
  grant all on tables    to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 10: Indexes (performance)
-- ═══════════════════════════════════════════════════════════════

create index idx_profiles_level      on public.student_profiles(school_level);
create index idx_tutor_user          on public.tutor_sessions(user_id);
create index idx_tutor_created       on public.tutor_sessions(created_at desc);
create index idx_tutor_subject       on public.tutor_sessions(subject);
create index idx_practice_user       on public.practice_attempts(user_id);
create index idx_practice_created    on public.practice_attempts(created_at desc);
create index idx_practice_subject    on public.practice_attempts(subject);
create index idx_practice_correct    on public.practice_attempts(is_correct);
create index idx_usage_type          on public.usage_events(event_type);
create index idx_usage_created       on public.usage_events(created_at desc);
create index idx_notes_user          on public.study_notes(user_id);
create index idx_decks_user          on public.decks(user_id);
create index idx_decks_subject       on public.decks(subject);
create index idx_cards_deck          on public.deck_cards(deck_id);
create index idx_cards_review        on public.deck_cards(next_review_at);
create index idx_cards_type          on public.deck_cards(card_type);
create index idx_session_code        on public.study_sessions(invite_code);
create index idx_session_public      on public.study_sessions(is_public) where is_public = true;
create index idx_session_members     on public.session_members(session_id);
create index idx_session_members_usr on public.session_members(user_id);
create index idx_materials_session   on public.session_materials(session_id);
create index idx_messages_session    on public.session_messages(session_id, created_at desc);
create index idx_annotations_session on public.session_annotations(session_id);
create index idx_progress_session    on public.session_progress(session_id, user_id);
create index idx_checkin_session     on public.check_in_responses(session_id);
create index idx_revision_session    on public.revision_items(session_id);
create index idx_revision_review     on public.revision_items(next_review_at);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 11: Triggers
-- ═══════════════════════════════════════════════════════════════

-- 11a. Auto-create student profile on Supabase Auth sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.student_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 11b. Auto-update updated_at columns
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profile_updated
  before update on public.student_profiles
  for each row execute function public.touch_updated_at();

create trigger trg_progress_updated
  before update on public.session_progress
  for each row execute function public.touch_updated_at();

create trigger trg_deck_updated
  before update on public.decks
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- SECTION 12: Database Functions (callable from app via rpc())
-- ═══════════════════════════════════════════════════════════════

-- 12a. Dashboard summary for a user
create or replace function public.dashboard_summary(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_tutor_total    int;
  v_tutor_today    int;
  v_practice_total int;
  v_practice_correct int;
  v_streak         int;
  v_result         jsonb;
begin
  select count(*) into v_tutor_total
    from public.tutor_sessions where user_id = p_user_id;

  select count(*) into v_tutor_today
    from public.tutor_sessions
    where user_id = p_user_id
      and created_at >= date_trunc('day', now());

  select count(*), coalesce(sum(case when is_correct then 1 else 0 end), 0)
    into v_practice_total, v_practice_correct
    from public.practice_attempts where user_id = p_user_id;

  -- Study streak: consecutive days with activity
  with activity_days as (
    select distinct date_trunc('day', created_at)::date as d
    from (
      select created_at from public.tutor_sessions where user_id = p_user_id
      union all
      select created_at from public.practice_attempts where user_id = p_user_id
    ) combined
  ),
  ranked as (
    select d, d - (row_number() over (order by d desc))::int as grp
    from activity_days
  ),
  streaks as (
    select count(*) as streak_len
    from ranked
    where grp = (select grp from ranked where d = current_date limit 1)
  )
  select coalesce(max(streak_len), 0) into v_streak from streaks;

  v_result = jsonb_build_object(
    'tutor_total',      v_tutor_total,
    'tutor_today',      v_tutor_today,
    'practice_total',   v_practice_total,
    'practice_correct', v_practice_correct,
    'accuracy',         case when v_practice_total > 0
                          then round(v_practice_correct::numeric / v_practice_total * 100)
                          else 0 end,
    'streak',           v_streak
  );
  return v_result;
end;
$$;

-- 12b. Leaderboard: top students by total activity
create or replace function public.leaderboard(p_limit int default 10)
returns table(
  user_id uuid,
  display_name text,
  avatar text,
  school_name text,
  total_activity bigint
) language sql security definer as $$
  select
    sp.id as user_id,
    sp.display_name,
    sp.avatar,
    sp.school_name,
    (
      (select count(*) from public.tutor_sessions ts where ts.user_id = sp.id) +
      (select count(*) from public.practice_attempts pa where pa.user_id = sp.id)
    ) as total_activity
  from public.student_profiles sp
  order by total_activity desc
  limit p_limit;
$$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 13: Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

alter table public.student_profiles    enable row level security;
alter table public.subjects            enable row level security;
alter table public.topics              enable row level security;
alter table public.tutor_sessions      enable row level security;
alter table public.practice_attempts   enable row level security;
alter table public.usage_events        enable row level security;
alter table public.study_notes         enable row level security;
alter table public.decks               enable row level security;
alter table public.deck_cards          enable row level security;
alter table public.study_sessions      enable row level security;
alter table public.session_members     enable row level security;
alter table public.session_materials   enable row level security;
alter table public.session_messages    enable row level security;
alter table public.session_annotations enable row level security;
alter table public.session_progress    enable row level security;
alter table public.check_in_responses  enable row level security;
alter table public.revision_items      enable row level security;

-- ── Subjects / Topics: public read-only ──
create policy "subjects_select" on public.subjects
  for select using (true);
create policy "topics_select" on public.topics
  for select using (true);

-- ── Student profiles ──
create policy "profiles_select_own" on public.student_profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.student_profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_trigger" on public.student_profiles
  for insert with check (auth.uid() = id);

-- ── Tutor sessions ──
create policy "tutor_insert" on public.tutor_sessions
  for insert with check (true);
create policy "tutor_select_own" on public.tutor_sessions
  for select using (auth.uid() = user_id);
create policy "tutor_select_anon" on public.tutor_sessions
  for select using (user_id is null);

-- ── Practice attempts ──
create policy "practice_insert" on public.practice_attempts
  for insert with check (true);
create policy "practice_select_own" on public.practice_attempts
  for select using (auth.uid() = user_id);
create policy "practice_select_anon" on public.practice_attempts
  for select using (user_id is null);

-- ── Usage events ──
create policy "usage_insert" on public.usage_events
  for insert with check (true);
create policy "usage_select" on public.usage_events
  for select using (true);

-- ── Study notes ──
create policy "notes_all_own" on public.study_notes
  for all using (auth.uid() = user_id);

-- ── Decks ──
create policy "decks_all_own" on public.decks
  for all using (auth.uid() = user_id);

-- ── Deck cards (access through deck ownership) ──
create policy "cards_all_own" on public.deck_cards
  for all using (
    deck_id in (select id from public.decks where user_id = auth.uid())
  );

-- ── Study sessions ──
create policy "sessions_select_public" on public.study_sessions
  for select using (is_public = true);
create policy "sessions_select_member" on public.study_sessions
  for select using (
    id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "sessions_insert" on public.study_sessions
  for insert with check (auth.uid() = creator_id);
create policy "sessions_update_creator" on public.study_sessions
  for update using (auth.uid() = creator_id);
create policy "sessions_delete_creator" on public.study_sessions
  for delete using (auth.uid() = creator_id);

-- ── Session members ──
create policy "members_select" on public.session_members
  for select using (
    session_id in (select session_id from public.session_members sm where sm.user_id = auth.uid())
  );
create policy "members_insert" on public.session_members
  for insert with check (auth.uid() = user_id);
create policy "members_delete_self" on public.session_members
  for delete using (auth.uid() = user_id);

-- ── Session materials ──
create policy "materials_select_member" on public.session_materials
  for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "materials_insert_member" on public.session_materials
  for insert with check (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "materials_delete_uploader" on public.session_materials
  for delete using (uploaded_by = auth.uid());

-- ── Session messages ──
create policy "messages_select_member" on public.session_messages
  for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "messages_insert_member" on public.session_messages
  for insert with check (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );

-- ── Session annotations ──
create policy "annotations_select_member" on public.session_annotations
  for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "annotations_insert_member" on public.session_annotations
  for insert with check (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );

-- ── Session progress ──
create policy "progress_all_own" on public.session_progress
  for all using (auth.uid() = user_id);

-- ── Check-in responses ──
create policy "checkins_all_own" on public.check_in_responses
  for all using (auth.uid() = user_id);

-- ── Revision items ──
create policy "revision_select_member" on public.revision_items
  for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "revision_insert_member" on public.revision_items
  for insert with check (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "revision_update_own" on public.revision_items
  for update using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 14: Realtime Subscriptions
-- ═══════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'session_messages'
  ) then
    alter publication supabase_realtime add table public.session_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'session_progress'
  ) then
    alter publication supabase_realtime add table public.session_progress;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'session_annotations'
  ) then
    alter publication supabase_realtime add table public.session_annotations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'check_in_responses'
  ) then
    alter publication supabase_realtime add table public.check_in_responses;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'revision_items'
  ) then
    alter publication supabase_realtime add table public.revision_items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tutor_sessions'
  ) then
    alter publication supabase_realtime add table public.tutor_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'usage_events'
  ) then
    alter publication supabase_realtime add table public.usage_events;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 15: Storage Bucket (for uploaded study materials)
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Authenticated users can upload materials'
  ) then
    create policy "Authenticated users can upload materials"
      on storage.objects for insert
      with check (bucket_id = 'materials' and auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Users can read own uploaded materials'
  ) then
    create policy "Users can read own uploaded materials"
      on storage.objects for select
      using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Users can delete own uploaded materials'
  ) then
    create policy "Users can delete own uploaded materials"
      on storage.objects for delete
      using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 16: Seed Data — Subjects (16 Ghanaian curriculum subjects)
-- ═══════════════════════════════════════════════════════════════

insert into public.subjects (name, emoji, levels) values
  ('Mathematics',                '📐', '{BECE,WASSCE}'),
  ('Integrated Science',         '🔬', '{BECE}'),
  ('English Language',           '📖', '{BECE,WASSCE}'),
  ('Social Studies',             '🌍', '{BECE}'),
  ('Physics',                    '⚡', '{WASSCE}'),
  ('Chemistry',                  '🧪', '{WASSCE}'),
  ('Biology',                    '🧬', '{WASSCE}'),
  ('Economics',                  '📊', '{WASSCE}'),
  ('Religious & Moral Education','🙏', '{BECE}'),
  ('Computing',                  '💻', '{BECE}'),
  ('Elective Maths',             '🔢', '{WASSCE}'),
  ('Business Management',        '💼', '{WASSCE}'),
  ('Literature',                 '📜', '{WASSCE}'),
  ('History',                    '🏛️', '{WASSCE}'),
  ('Geography',                  '🗺️', '{WASSCE}'),
  ('General Science',            '🔭', '{WASSCE}');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 17: Seed Data — Topics per Subject
-- ═══════════════════════════════════════════════════════════════

-- Mathematics (id=1)
insert into public.topics (subject_id, name, level) values
  (1,'Number & Numeration','BECE'),(1,'Algebra','BECE'),(1,'Geometry','BECE'),
  (1,'Statistics','BECE'),(1,'Measurement','BECE'),(1,'Sets','BECE'),
  (1,'Quadratic Equations','WASSCE'),(1,'Indices & Logarithms','WASSCE'),
  (1,'Trigonometry','WASSCE'),(1,'Probability','WASSCE'),
  (1,'Vectors','WASSCE'),(1,'Matrices','WASSCE'),
  (1,'Sequences & Series','WASSCE'),(1,'Calculus','WASSCE');

-- Integrated Science (id=2)
insert into public.topics (subject_id, name, level) values
  (2,'Living Things','BECE'),(2,'Matter & Change','BECE'),
  (2,'Energy','BECE'),(2,'Earth & Environment','BECE'),
  (2,'Human Body','BECE'),(2,'Photosynthesis','BECE'),
  (2,'Ecosystems','BECE'),(2,'Forces & Motion','BECE'),
  (2,'Chemical Reactions','BECE'),(2,'Reproduction','BECE');

-- English Language (id=3)
insert into public.topics (subject_id, name, level) values
  (3,'Comprehension','BECE'),(3,'Essay Writing','BECE'),
  (3,'Grammar & Usage','BECE'),(3,'Vocabulary','BECE'),
  (3,'Letter Writing','WASSCE'),(3,'Summary','WASSCE'),
  (3,'Oral English','WASSCE'),(3,'Narrative Writing','WASSCE');

-- Social Studies (id=4)
insert into public.topics (subject_id, name, level) values
  (4,'Ghana History','BECE'),(4,'Government & Governance','BECE'),
  (4,'Physical Environment','BECE'),(4,'Culture & Identity','BECE'),
  (4,'Economic Development','BECE'),(4,'Citizenship','BECE'),
  (4,'West Africa','BECE'),(4,'Climate & Weather','BECE');

-- Physics (id=5)
insert into public.topics (subject_id, name, level) values
  (5,'Mechanics','WASSCE'),(5,'Waves & Sound','WASSCE'),
  (5,'Optics & Light','WASSCE'),(5,'Electricity','WASSCE'),
  (5,'Magnetism','WASSCE'),(5,'Nuclear Physics','WASSCE'),
  (5,'Thermodynamics','WASSCE'),(5,'Measurements','WASSCE');

-- Chemistry (id=6)
insert into public.topics (subject_id, name, level) values
  (6,'Atomic Structure','WASSCE'),(6,'Chemical Bonding','WASSCE'),
  (6,'Periodicity','WASSCE'),(6,'Acids Bases & Salts','WASSCE'),
  (6,'Organic Chemistry','WASSCE'),(6,'Electrochemistry','WASSCE'),
  (6,'Industrial Chemistry','WASSCE'),(6,'Stoichiometry','WASSCE');

-- Biology (id=7)
insert into public.topics (subject_id, name, level) values
  (7,'Cell Biology','WASSCE'),(7,'Genetics & Heredity','WASSCE'),
  (7,'Ecology','WASSCE'),(7,'Human Physiology','WASSCE'),
  (7,'Plant Biology','WASSCE'),(7,'Microbiology','WASSCE'),
  (7,'Evolution','WASSCE'),(7,'Respiration','WASSCE');

-- Economics (id=8)
insert into public.topics (subject_id, name, level) values
  (8,'Demand & Supply','WASSCE'),(8,'Market Structures','WASSCE'),
  (8,'National Income','WASSCE'),(8,'Money & Banking','WASSCE'),
  (8,'International Trade','WASSCE'),(8,'Development Economics','WASSCE'),
  (8,'Public Finance','WASSCE'),(8,'Inflation','WASSCE');

-- Religious & Moral Education (id=9)
insert into public.topics (subject_id, name, level) values
  (9,'God & Creation','BECE'),(9,'Moral Teachings','BECE'),
  (9,'Religious Leaders','BECE'),(9,'Prayer & Worship','BECE'),
  (9,'Festivals & Celebrations','BECE'),(9,'Golden Rule','BECE');

-- Computing (id=10)
insert into public.topics (subject_id, name, level) values
  (10,'Introduction to Computers','BECE'),(10,'Word Processing','BECE'),
  (10,'Spreadsheets','BECE'),(10,'Internet & Email','BECE'),
  (10,'Computer Hardware','BECE'),(10,'Programming Basics','BECE');

-- Elective Maths (id=11)
insert into public.topics (subject_id, name, level) values
  (11,'Complex Numbers','WASSCE'),(11,'Polynomials','WASSCE'),
  (11,'Coordinate Geometry','WASSCE'),(11,'Differentiation','WASSCE'),
  (11,'Integration','WASSCE'),(11,'Statistics & Probability','WASSCE'),
  (11,'Vectors in 3D','WASSCE'),(11,'Permutation & Combination','WASSCE');

-- Business Management (id=12)
insert into public.topics (subject_id, name, level) values
  (12,'Business Organisation','WASSCE'),(12,'Management Functions','WASSCE'),
  (12,'Marketing','WASSCE'),(12,'Accounting Basics','WASSCE'),
  (12,'Human Resource','WASSCE'),(12,'Business Environment','WASSCE');

-- Literature (id=13)
insert into public.topics (subject_id, name, level) values
  (13,'Drama','WASSCE'),(13,'Poetry','WASSCE'),
  (13,'Prose Fiction','WASSCE'),(13,'Literary Devices','WASSCE'),
  (13,'African Literature','WASSCE'),(13,'Shakespearean Drama','WASSCE');

-- History (id=14)
insert into public.topics (subject_id, name, level) values
  (14,'Pre-Colonial Ghana','WASSCE'),(14,'Colonialism','WASSCE'),
  (14,'Nationalism & Independence','WASSCE'),(14,'Post-Independence Africa','WASSCE'),
  (14,'World Wars','WASSCE'),(14,'Cold War','WASSCE');

-- Geography (id=15)
insert into public.topics (subject_id, name, level) values
  (15,'Map Reading','WASSCE'),(15,'Physical Geography','WASSCE'),
  (15,'Human Geography','WASSCE'),(15,'Settlement','WASSCE'),
  (15,'Population','WASSCE'),(15,'Climate & Vegetation','WASSCE'),
  (15,'Economic Activities','WASSCE');

-- General Science (id=16)
insert into public.topics (subject_id, name, level) values
  (16,'Scientific Method','WASSCE'),(16,'Energy & Power','WASSCE'),
  (16,'Environmental Science','WASSCE'),(16,'Health & Disease','WASSCE'),
  (16,'Agricultural Science','WASSCE'),(16,'Technology & Society','WASSCE');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 18: Seed Data — Mock Tutor Sessions (for dashboard)
-- ═══════════════════════════════════════════════════════════════

insert into public.tutor_sessions (session_id, subject, level, topic, question, language, created_at) values
  ('demo','Mathematics','BECE','Algebra','What is the value of x if 3x + 7 = 22?','english',now() - interval '0 days'),
  ('demo','Mathematics','BECE','Number & Numeration','How do I find the LCM of 12 and 18?','english',now() - interval '0 days'),
  ('demo','Integrated Science','BECE','Photosynthesis','Explain photosynthesis in simple terms','english',now() - interval '1 day'),
  ('demo','English Language','BECE','Grammar & Usage','When do I use "has" vs "have"?','english',now() - interval '1 day'),
  ('demo','Physics','WASSCE','Mechanics','Explain Newton''s second law with a Ghana trotro example','english',now() - interval '2 days'),
  ('demo','Chemistry','WASSCE','Atomic Structure','What is the difference between protons and neutrons?','english',now() - interval '2 days'),
  ('demo','Biology','WASSCE','Cell Biology','Describe the structure of a plant cell','english',now() - interval '3 days'),
  ('demo','Mathematics','WASSCE','Quadratic Equations','Solve x² - 5x + 6 = 0','english',now() - interval '3 days'),
  ('demo','Economics','WASSCE','Demand & Supply','What happens to price when demand increases?','english',now() - interval '4 days'),
  ('demo','Social Studies','BECE','Ghana History','Hwan na ɔyɛɛ Ghana aban panin a ɔdi kan?','twi',now() - interval '4 days'),
  ('demo','Mathematics','BECE','Statistics','How do I calculate the mean of a data set?','english',now() - interval '5 days'),
  ('demo','Integrated Science','BECE','Human Body','Liver no yɛ dɛn wɔ yɛn nipadua mu?','twi',now() - interval '5 days'),
  ('demo','Physics','WASSCE','Electricity','Calculate the resistance if V=12V and I=3A','english',now() - interval '6 days'),
  ('demo','English Language','WASSCE','Essay Writing','How do I write a good introduction paragraph?','english',now() - interval '6 days'),
  ('demo','Biology','WASSCE','Genetics & Heredity','How do I solve a Punnett square problem?','english',now() - interval '7 days'),
  ('demo','Chemistry','WASSCE','Organic Chemistry','What is the difference between alkanes and alkenes?','english',now() - interval '7 days'),
  ('demo','Computing','BECE','Programming Basics','What is an algorithm? Give me a simple example','english',now() - interval '8 days'),
  ('demo','History','WASSCE','Colonialism','Why did the British colonise the Gold Coast?','english',now() - interval '8 days');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 19: Seed Data — Mock Practice Attempts
-- ═══════════════════════════════════════════════════════════════

insert into public.practice_attempts (session_id, subject, level, topic, question, student_answer, is_correct, created_at) values
  ('demo','Mathematics','BECE','Algebra','Simplify 3x + 2x - x','B',true,now() - interval '0 days'),
  ('demo','Mathematics','BECE','Number & Numeration','What is 15% of GH₵ 200?','GH₵ 30',true,now() - interval '0 days'),
  ('demo','Integrated Science','BECE','Photosynthesis','What gas do plants absorb during photosynthesis?','CO2',true,now() - interval '1 day'),
  ('demo','Physics','WASSCE','Mechanics','F=ma. If m=5kg and a=3m/s², F=?','15N',true,now() - interval '1 day'),
  ('demo','Chemistry','WASSCE','Atomic Structure','How many electrons does Carbon have?','4',false,now() - interval '2 days'),
  ('demo','Mathematics','WASSCE','Quadratic Equations','Factorise x² - 9','(x+3)(x-3)',true,now() - interval '2 days'),
  ('demo','Biology','WASSCE','Cell Biology','What organelle produces energy?','Mitochondria',true,now() - interval '3 days'),
  ('demo','English Language','BECE','Grammar & Usage','She ___ to school yesterday. (go)','went',true,now() - interval '3 days'),
  ('demo','Economics','WASSCE','Demand & Supply','When supply exceeds demand, price ___','increases',false,now() - interval '4 days'),
  ('demo','Social Studies','BECE','Ghana History','In what year did Ghana gain independence?','1960',false,now() - interval '4 days'),
  ('demo','Mathematics','BECE','Geometry','Sum of angles in a triangle?','180',true,now() - interval '5 days'),
  ('demo','Physics','WASSCE','Electricity','V=IR. If I=2A and R=5Ω, V=?','10V',true,now() - interval '5 days'),
  ('demo','Biology','WASSCE','Ecology','Define a food chain','Producers to consumers',true,now() - interval '6 days'),
  ('demo','Chemistry','WASSCE','Periodicity','Why do noble gases not react easily?','Full outer shell',true,now() - interval '6 days'),
  ('demo','English Language','WASSCE','Summary','Summarise the passage in 5 sentences','(student answer)',false,now() - interval '7 days'),
  ('demo','Mathematics','BECE','Probability','Probability of head on fair coin?','1/2',true,now() - interval '7 days');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 20: Seed Data — Mock Usage Events
-- ═══════════════════════════════════════════════════════════════

insert into public.usage_events (event_type, subject, level, language, created_at) values
  ('tutor_ask','Mathematics','BECE','en',now() - interval '0 days'),
  ('tutor_ask','Integrated Science','BECE','en',now() - interval '1 day'),
  ('practice_submit','Physics','WASSCE','en',now() - interval '1 day'),
  ('tutor_ask','Chemistry','WASSCE','twi',now() - interval '2 days'),
  ('practice_submit','Mathematics','BECE','en',now() - interval '2 days'),
  ('guidance_generate','Mathematics','BECE','en',now() - interval '3 days'),
  ('advisory_plan','Physics','WASSCE','en',now() - interval '3 days'),
  ('deck_create','Biology','WASSCE','en',now() - interval '4 days'),
  ('studyg_quiz_generate','Physics','WASSCE','en',now() - interval '5 days'),
  ('studyg_quiz_mark','Physics','WASSCE','en',now() - interval '5 days'),
  ('nlp_route','Mathematics','BECE','twi',now() - interval '6 days'),
  ('tutor_ask','Economics','WASSCE','en',now() - interval '7 days');

-- ═══════════════════════════════════════════════════════════════
-- SECTION 21: Seed Data — Mock Study Notes
-- ═══════════════════════════════════════════════════════════════

-- These require a real user_id, so they'll be empty until sign-up.
-- The app uses localStorage for demo mode, so this is fine.

-- ═══════════════════════════════════════════════════════════════
-- SECTION 22: Verification query (run after to confirm)
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  t_count int;
begin
  select count(*) into t_count
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE';

  raise notice '✅ Schema created successfully! % tables in public schema.', t_count;
  raise notice '✅ Subjects: % rows', (select count(*) from public.subjects);
  raise notice '✅ Topics: % rows', (select count(*) from public.topics);
  raise notice '✅ Mock tutor sessions: % rows', (select count(*) from public.tutor_sessions);
  raise notice '✅ Mock practice attempts: % rows', (select count(*) from public.practice_attempts);
  raise notice '✅ Storage bucket: materials';
end $$;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  DONE! Your Akuafo AI Supabase backend is ready for production.  ║
-- ║                                                                    ║
-- ║  Tables:                                                           ║
-- ║    student_profiles    — user accounts (auto-created on sign-up)   ║
-- ║    subjects            — 16 Ghanaian curriculum subjects            ║
-- ║    topics              — 120+ topics per subject per level          ║
-- ║    tutor_sessions      — AI tutor chat history                     ║
-- ║    practice_attempts   — quiz/practice results with marking        ║
-- ║    decks               — flashcard decks (spaced repetition)       ║
-- ║    deck_cards          — individual cards with spaced repetition   ║
-- ║    study_notes         — personal study notes                      ║
-- ║    usage_events        — analytics events                          ║
-- ║    study_sessions      — group study rooms                         ║
-- ║    session_members     — who's in each study group                 ║
-- ║    session_materials   — uploaded documents per session             ║
-- ║    session_messages    — group chat messages                       ║
-- ║    session_annotations — page-level notes on materials             ║
-- ║    session_progress    — per-user page progress                    ║
-- ║    check_in_responses  — periodic progress check-ins               ║
-- ║    revision_items      — spaced repetition revision topics         ║
-- ║                                                                    ║
-- ║  Functions:                                                        ║
-- ║    dashboard_summary(user_id)  — get user stats in one call       ║
-- ║    leaderboard(limit)          — top students by activity          ║
-- ║    handle_new_user()           — auto-create profile on sign-up   ║
-- ║    touch_updated_at()          — auto-update timestamps            ║
-- ║    generate_user_id()          — USR00001, USR00002...            ║
-- ║    generate_session_id()       — SES00001, SES00002...            ║
-- ║    generate_deck_id()          — DCK00001, DCK00002...            ║
-- ║                                                                    ║
-- ║  RLS: Every table has row-level security policies.                ║
-- ║  Realtime: Messages, progress, annotations, check-ins stream.    ║
-- ║  Storage: 'materials' bucket for file uploads.                    ║
-- ╚════════════════════════════════════════════════════════════════════╝
