-- ============================================================
-- EDUGAP AI — Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- Drops existing tables first so it's safe to re-run
-- ============================================================

-- ────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────
-- 1. Drop everything (order matters for FKs)
-- ────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.generate_user_id() cascade;
drop function if exists public.generate_session_id() cascade;

drop table if exists public.check_in_responses cascade;
drop table if exists public.session_progress cascade;
drop table if exists public.session_materials cascade;
drop table if exists public.session_members cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.deck_cards cascade;
drop table if exists public.decks cascade;
drop table if exists public.study_notes cascade;
drop table if exists public.practice_attempts cascade;
drop table if exists public.tutor_sessions cascade;
drop table if exists public.usage_events cascade;
drop table if exists public.student_profiles cascade;
drop table if exists public.topics cascade;
drop table if exists public.subjects cascade;

drop sequence if exists public.user_id_seq;
drop sequence if exists public.session_id_seq;

-- ────────────────────────────────────────────────
-- 2. Sequences for human-readable IDs
-- ────────────────────────────────────────────────

create sequence public.user_id_seq start 1;
create sequence public.session_id_seq start 1;

create or replace function public.generate_user_id()
returns text language sql as $$
  select 'USR' || lpad(nextval('public.user_id_seq')::text, 5, '0');
$$;

create or replace function public.generate_session_id()
returns text language sql as $$
  select 'SES' || lpad(nextval('public.session_id_seq')::text, 5, '0');
$$;

-- ────────────────────────────────────────────────
-- 3. Core tables
-- ────────────────────────────────────────────────

-- 3a. Student profiles (created automatically on sign-up)
create table public.student_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_id    text unique not null default public.generate_user_id(),
  display_name  text,
  email         text,
  avatar        text default '🎓',
  school_name   text,
  school_level  text check (school_level in ('BECE','WASSCE')),
  primary_subjects text[] default '{}',
  exam_date     date,
  language_pref text default 'en' check (language_pref in ('en','twi')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3b. Subjects catalog
create table public.subjects (
  id         serial primary key,
  name       text unique not null,
  emoji      text default '',
  levels     text[] not null default '{}'  -- e.g. {'BECE','WASSCE'}
);

-- 3c. Topics per subject
create table public.topics (
  id         serial primary key,
  subject_id int not null references public.subjects(id) on delete cascade,
  name       text not null,
  level      text check (level in ('BECE','WASSCE')),
  unique(subject_id, name)
);

-- 3d. Tutor sessions (every tutor chat exchange)
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

-- 3e. Practice attempts
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

-- 3f. Usage events (analytics)
create table public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  event_type text not null,
  subject    text,
  level      text,
  language   text,
  user_id    uuid references public.student_profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 3g. Study notes
create table public.study_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.student_profiles(id) on delete cascade,
  subject    text not null,
  topic      text default 'General',
  note       text not null,
  created_at timestamptz default now()
);

-- 3h. Practice decks
create table public.decks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.student_profiles(id) on delete cascade,
  title           text not null,
  subject         text not null,
  level           text not null check (level in ('BECE','WASSCE')),
  description     text,
  source_material text,
  created_at      timestamptz default now(),
  last_studied_at timestamptz
);

-- 3i. Cards inside decks
create table public.deck_cards (
  id              uuid primary key default gen_random_uuid(),
  deck_id         uuid not null references public.decks(id) on delete cascade,
  card_type       text not null check (card_type in ('flashcard','mcq','fill_blank')),
  front           text not null,
  back            text not null,
  options         text[],
  ease_factor     real default 2.5,
  interval_days   int default 0,
  repetitions     int default 0,
  next_review_at  timestamptz default now(),
  last_reviewed_at timestamptz,
  created_at      timestamptz default now()
);

-- ────────────────────────────────────────────────
-- 4. Group study sessions
-- ────────────────────────────────────────────────

create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  display_id       text unique not null default public.generate_session_id(),
  creator_id       uuid not null references public.student_profiles(id) on delete cascade,
  title            text not null,
  course           text not null,
  level            text not null check (level in ('BECE','WASSCE')),
  invite_code      text unique not null,
  is_public        boolean default true,
  minutes_per_page int default 3,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz default now()
);

create table public.session_members (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id    uuid not null references public.student_profiles(id) on delete cascade,
  role       text default 'member' check (role in ('creator','member')),
  joined_at  timestamptz default now(),
  unique(session_id, user_id)
);

create table public.session_materials (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  title      text not null,
  body       text not null,
  pages      int default 1,
  file_url   text,
  uploaded_by uuid references public.student_profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table public.session_progress (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.study_sessions(id) on delete cascade,
  user_id     uuid not null references public.student_profiles(id) on delete cascade,
  material_id uuid not null references public.session_materials(id) on delete cascade,
  current_page int default 1,
  updated_at  timestamptz default now(),
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

-- ────────────────────────────────────────────────
-- 5. Indexes
-- ────────────────────────────────────────────────

create index idx_tutor_user on public.tutor_sessions(user_id);
create index idx_tutor_created on public.tutor_sessions(created_at desc);
create index idx_practice_user on public.practice_attempts(user_id);
create index idx_practice_created on public.practice_attempts(created_at desc);
create index idx_usage_type on public.usage_events(event_type);
create index idx_notes_user on public.study_notes(user_id);
create index idx_decks_user on public.decks(user_id);
create index idx_cards_deck on public.deck_cards(deck_id);
create index idx_cards_review on public.deck_cards(next_review_at);
create index idx_session_code on public.study_sessions(invite_code);
create index idx_session_members on public.session_members(session_id);
create index idx_session_progress on public.session_progress(session_id, user_id);
create index idx_checkin_session on public.check_in_responses(session_id);

-- ────────────────────────────────────────────────
-- 6. Auto-create profile on Supabase Auth sign-up
-- ────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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

-- ────────────────────────────────────────────────
-- 7. Updated_at auto-touch trigger
-- ────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────
-- 8. Row Level Security (RLS)
-- ────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.student_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.tutor_sessions enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.usage_events enable row level security;
alter table public.study_notes enable row level security;
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_members enable row level security;
alter table public.session_materials enable row level security;
alter table public.session_progress enable row level security;
alter table public.check_in_responses enable row level security;

-- ── Subjects / Topics: public read ──
create policy "Anyone can read subjects"
  on public.subjects for select using (true);
create policy "Anyone can read topics"
  on public.topics for select using (true);

-- ── Student profiles ──
create policy "Users can read own profile"
  on public.student_profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.student_profiles for update using (auth.uid() = id);
create policy "Profiles auto-created via trigger"
  on public.student_profiles for insert with check (auth.uid() = id);

-- ── Tutor sessions ──
create policy "Users can insert tutor sessions"
  on public.tutor_sessions for insert with check (true);
create policy "Users can read own tutor sessions"
  on public.tutor_sessions for select using (auth.uid() = user_id);
create policy "Anon can read aggregate tutor data"
  on public.tutor_sessions for select using (user_id is null);

-- ── Practice attempts ──
create policy "Users can insert practice attempts"
  on public.practice_attempts for insert with check (true);
create policy "Users can read own practice"
  on public.practice_attempts for select using (auth.uid() = user_id);

-- ── Usage events ──
create policy "Anyone can insert usage events"
  on public.usage_events for insert with check (true);
create policy "Anyone can read usage events"
  on public.usage_events for select using (true);

-- ── Study notes ──
create policy "Users can manage own notes"
  on public.study_notes for all using (auth.uid() = user_id);

-- ── Decks ──
create policy "Users can manage own decks"
  on public.decks for all using (auth.uid() = user_id);

-- ── Deck cards ──
create policy "Users can manage cards in own decks"
  on public.deck_cards for all using (
    deck_id in (select id from public.decks where user_id = auth.uid())
  );

-- ── Study sessions ──
create policy "Anyone can read public sessions"
  on public.study_sessions for select using (is_public = true);
create policy "Members can read their sessions"
  on public.study_sessions for select using (
    id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "Auth users can create sessions"
  on public.study_sessions for insert with check (auth.uid() = creator_id);
create policy "Creator can update session"
  on public.study_sessions for update using (auth.uid() = creator_id);
create policy "Creator can delete session"
  on public.study_sessions for delete using (auth.uid() = creator_id);

-- ── Session members ──
create policy "Members can read membership"
  on public.session_members for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "Auth users can join sessions"
  on public.session_members for insert with check (auth.uid() = user_id);

-- ── Session materials ──
create policy "Members can read materials"
  on public.session_materials for select using (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );
create policy "Members can add materials"
  on public.session_materials for insert with check (
    session_id in (select session_id from public.session_members where user_id = auth.uid())
  );

-- ── Session progress ──
create policy "Members can manage own progress"
  on public.session_progress for all using (auth.uid() = user_id);

-- ── Check-in responses ──
create policy "Members can manage own check-ins"
  on public.check_in_responses for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- 9. Realtime subscriptions
-- ────────────────────────────────────────────────

alter publication supabase_realtime add table public.tutor_sessions;
alter publication supabase_realtime add table public.usage_events;
alter publication supabase_realtime add table public.session_progress;
alter publication supabase_realtime add table public.check_in_responses;

-- ────────────────────────────────────────────────
-- 10. Seed data: Subjects & Topics
-- ────────────────────────────────────────────────

insert into public.subjects (name, emoji, levels) values
  ('Mathematics',        '📐', '{BECE,WASSCE}'),
  ('Integrated Science', '🔬', '{BECE}'),
  ('English Language',   '📖', '{BECE,WASSCE}'),
  ('Social Studies',     '🌍', '{BECE}'),
  ('Physics',            '⚡', '{WASSCE}'),
  ('Chemistry',          '🧪', '{WASSCE}'),
  ('Biology',            '🧬', '{WASSCE}'),
  ('Economics',          '📊', '{WASSCE}'),
  ('Religious & Moral Education', '🙏', '{BECE}'),
  ('Computing',          '💻', '{BECE}'),
  ('Elective Maths',     '🔢', '{WASSCE}'),
  ('Business Management','💼', '{WASSCE}'),
  ('Literature',         '📜', '{WASSCE}'),
  ('History',            '🏛️', '{WASSCE}'),
  ('Geography',          '🗺️', '{WASSCE}'),
  ('General Science',    '🔭', '{WASSCE}');

-- Mathematics topics
insert into public.topics (subject_id, name, level) values
  (1, 'Number & Numeration', 'BECE'), (1, 'Algebra', 'BECE'), (1, 'Geometry', 'BECE'),
  (1, 'Statistics', 'BECE'), (1, 'Measurement', 'BECE'), (1, 'Sets', 'BECE'),
  (1, 'Quadratic Equations', 'WASSCE'), (1, 'Indices & Logarithms', 'WASSCE'),
  (1, 'Trigonometry', 'WASSCE'), (1, 'Probability', 'WASSCE'),
  (1, 'Vectors', 'WASSCE'), (1, 'Matrices', 'WASSCE'),
  (1, 'Sequences & Series', 'WASSCE'), (1, 'Calculus', 'WASSCE');

-- Integrated Science topics
insert into public.topics (subject_id, name, level) values
  (2, 'Living Things', 'BECE'), (2, 'Matter & Change', 'BECE'),
  (2, 'Energy', 'BECE'), (2, 'Earth & Environment', 'BECE'),
  (2, 'Human Body', 'BECE'), (2, 'Photosynthesis', 'BECE'),
  (2, 'Ecosystems', 'BECE'), (2, 'Forces & Motion', 'BECE'),
  (2, 'Chemical Reactions', 'BECE'), (2, 'Reproduction', 'BECE');

-- English Language topics
insert into public.topics (subject_id, name, level) values
  (3, 'Comprehension', 'BECE'), (3, 'Essay Writing', 'BECE'),
  (3, 'Grammar & Usage', 'BECE'), (3, 'Vocabulary', 'BECE'),
  (3, 'Letter Writing', 'WASSCE'), (3, 'Summary', 'WASSCE'),
  (3, 'Oral English', 'WASSCE'), (3, 'Narrative Writing', 'WASSCE');

-- Social Studies topics
insert into public.topics (subject_id, name, level) values
  (4, 'Ghana History', 'BECE'), (4, 'Government & Governance', 'BECE'),
  (4, 'Physical Environment', 'BECE'), (4, 'Culture & Identity', 'BECE'),
  (4, 'Economic Development', 'BECE'), (4, 'Citizenship', 'BECE'),
  (4, 'West Africa', 'BECE'), (4, 'Climate & Weather', 'BECE');

-- Physics topics
insert into public.topics (subject_id, name, level) values
  (5, 'Mechanics', 'WASSCE'), (5, 'Waves & Sound', 'WASSCE'),
  (5, 'Optics & Light', 'WASSCE'), (5, 'Electricity', 'WASSCE'),
  (5, 'Magnetism', 'WASSCE'), (5, 'Nuclear Physics', 'WASSCE'),
  (5, 'Thermodynamics', 'WASSCE'), (5, 'Measurements', 'WASSCE');

-- Chemistry topics
insert into public.topics (subject_id, name, level) values
  (6, 'Atomic Structure', 'WASSCE'), (6, 'Chemical Bonding', 'WASSCE'),
  (6, 'Periodicity', 'WASSCE'), (6, 'Acids Bases & Salts', 'WASSCE'),
  (6, 'Organic Chemistry', 'WASSCE'), (6, 'Electrochemistry', 'WASSCE'),
  (6, 'Industrial Chemistry', 'WASSCE'), (6, 'Stoichiometry', 'WASSCE');

-- Biology topics
insert into public.topics (subject_id, name, level) values
  (7, 'Cell Biology', 'WASSCE'), (7, 'Genetics & Heredity', 'WASSCE'),
  (7, 'Ecology', 'WASSCE'), (7, 'Human Physiology', 'WASSCE'),
  (7, 'Plant Biology', 'WASSCE'), (7, 'Microbiology', 'WASSCE'),
  (7, 'Evolution', 'WASSCE'), (7, 'Respiration', 'WASSCE');

-- Economics topics
insert into public.topics (subject_id, name, level) values
  (8, 'Demand & Supply', 'WASSCE'), (8, 'Market Structures', 'WASSCE'),
  (8, 'National Income', 'WASSCE'), (8, 'Money & Banking', 'WASSCE'),
  (8, 'International Trade', 'WASSCE'), (8, 'Development Economics', 'WASSCE'),
  (8, 'Public Finance', 'WASSCE'), (8, 'Inflation', 'WASSCE');

-- ────────────────────────────────────────────────
-- 11. Seed data: Sample tutor & practice content
-- ────────────────────────────────────────────────

-- Sample tutor sessions for dashboard testing
insert into public.tutor_sessions (session_id, subject, level, topic, question, language, created_at) values
  ('demo', 'Mathematics', 'BECE', 'Algebra', 'What is the value of x if 3x + 7 = 22?', 'english', now() - interval '0 days'),
  ('demo', 'Mathematics', 'BECE', 'Number & Numeration', 'How do I find the LCM of 12 and 18?', 'english', now() - interval '0 days'),
  ('demo', 'Integrated Science', 'BECE', 'Photosynthesis', 'Explain photosynthesis in simple terms', 'english', now() - interval '1 day'),
  ('demo', 'English Language', 'BECE', 'Grammar & Usage', 'When do I use "has" vs "have"?', 'english', now() - interval '1 day'),
  ('demo', 'Physics', 'WASSCE', 'Mechanics', 'Explain Newton''s second law with a Ghana example', 'english', now() - interval '2 days'),
  ('demo', 'Chemistry', 'WASSCE', 'Atomic Structure', 'What is the difference between protons and neutrons?', 'english', now() - interval '2 days'),
  ('demo', 'Biology', 'WASSCE', 'Cell Biology', 'Describe the structure of a plant cell', 'english', now() - interval '3 days'),
  ('demo', 'Mathematics', 'WASSCE', 'Quadratic Equations', 'Solve x² - 5x + 6 = 0', 'english', now() - interval '3 days'),
  ('demo', 'Economics', 'WASSCE', 'Demand & Supply', 'What happens to price when demand increases?', 'english', now() - interval '4 days'),
  ('demo', 'Social Studies', 'BECE', 'Ghana History', 'Who was Kwame Nkrumah and what did he do?', 'twi', now() - interval '4 days'),
  ('demo', 'Mathematics', 'BECE', 'Statistics', 'How do I calculate the mean of a data set?', 'english', now() - interval '5 days'),
  ('demo', 'Integrated Science', 'BECE', 'Human Body', 'What is the function of the liver?', 'twi', now() - interval '5 days'),
  ('demo', 'Physics', 'WASSCE', 'Electricity', 'Calculate the resistance if V=12V and I=3A', 'english', now() - interval '6 days'),
  ('demo', 'English Language', 'WASSCE', 'Essay Writing', 'How do I write a good introduction paragraph?', 'english', now() - interval '6 days');

-- Sample practice attempts
insert into public.practice_attempts (session_id, subject, level, topic, question, student_answer, is_correct, created_at) values
  ('demo', 'Mathematics', 'BECE', 'Algebra', 'Simplify 3x + 2x - x', 'B', true, now() - interval '0 days'),
  ('demo', 'Mathematics', 'BECE', 'Number & Numeration', 'What is 15% of GH₵ 200?', 'GH₵ 30', true, now() - interval '0 days'),
  ('demo', 'Integrated Science', 'BECE', 'Photosynthesis', 'What gas do plants absorb during photosynthesis?', 'CO2', true, now() - interval '1 day'),
  ('demo', 'Physics', 'WASSCE', 'Mechanics', 'F = ma. If m=5kg and a=3m/s², what is F?', '15N', true, now() - interval '1 day'),
  ('demo', 'Chemistry', 'WASSCE', 'Atomic Structure', 'How many electrons does Carbon have?', '4', false, now() - interval '2 days'),
  ('demo', 'Mathematics', 'WASSCE', 'Quadratic Equations', 'Factorise x² - 9', '(x+3)(x-3)', true, now() - interval '2 days'),
  ('demo', 'Biology', 'WASSCE', 'Cell Biology', 'What organelle produces energy?', 'Mitochondria', true, now() - interval '3 days'),
  ('demo', 'English Language', 'BECE', 'Grammar & Usage', 'She ___ to school yesterday. (go)', 'went', true, now() - interval '3 days'),
  ('demo', 'Economics', 'WASSCE', 'Demand & Supply', 'When supply exceeds demand, price ___', 'increases', false, now() - interval '4 days'),
  ('demo', 'Social Studies', 'BECE', 'Ghana History', 'In what year did Ghana gain independence?', '1960', false, now() - interval '4 days'),
  ('demo', 'Mathematics', 'BECE', 'Geometry', 'Sum of angles in a triangle?', '180', true, now() - interval '5 days'),
  ('demo', 'Physics', 'WASSCE', 'Electricity', 'V = IR. If I=2A and R=5Ω, V=?', '10V', true, now() - interval '5 days');

-- ────────────────────────────────────────────────
-- 12. Supabase Storage bucket for file uploads
-- ────────────────────────────────────────────────
-- Run this separately in the Storage section or via:
--   insert into storage.buckets (id, name, public) values ('materials', 'materials', false);
-- Then add a policy:
--   create policy "Auth users can upload" on storage.objects
--     for insert with check (bucket_id = 'materials' and auth.role() = 'authenticated');
--   create policy "Auth users can read own" on storage.objects
--     for select using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

-- ────────────────────────────────────────────────
-- Done! Your schema is ready.
-- ────────────────────────────────────────────────
