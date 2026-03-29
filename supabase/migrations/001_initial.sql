-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  role text not null default 'user',
  is_banned boolean not null default false,
  notification_enabled boolean not null default false,
  notification_scope text not null default 'saved_only',
  notification_radius integer not null default 300,
  created_at timestamptz not null default now()
);

-- spots
create table spots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  lat double precision not null,
  lng double precision not null,
  prefecture text,
  city text,
  address text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spots_lat_lng_idx on spots (lat, lng);

-- reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  report_category text not null,
  violation_type text not null,
  description text not null,
  occurred_at timestamptz,
  status text not null default 'published',
  review_status text not null default 'clean',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- saved_spots
create table saved_spots (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (spot_id, user_id)
);

-- report_votes
create table report_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

-- report_flags
create table report_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

-- rule_articles
create table rule_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  violation_type text not null,
  summary text,
  body text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger spots_updated_at before update on spots for each row execute function update_updated_at();
create trigger reports_updated_at before update on reports for each row execute function update_updated_at();
create trigger rule_articles_updated_at before update on rule_articles for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function to auto-flag reports with 3+ flags
create or replace function check_report_flags()
returns trigger as $$
declare
  flag_count integer;
begin
  select count(*) into flag_count from report_flags where report_id = new.report_id;
  if flag_count >= 3 then
    update reports set review_status = 'flagged' where id = new.report_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger auto_flag_report
  after insert on report_flags
  for each row execute function check_report_flags();

-- Enable RLS
alter table profiles enable row level security;
alter table spots enable row level security;
alter table reports enable row level security;
alter table saved_spots enable row level security;
alter table report_votes enable row level security;
alter table report_flags enable row level security;
alter table rule_articles enable row level security;

-- RLS Policies

-- profiles
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile (except role and is_banned)" on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles where id = auth.uid())
    and is_banned = (select is_banned from profiles where id = auth.uid())
  );

-- spots
create policy "Spots are viewable by everyone" on spots for select using (true);
create policy "Authenticated non-banned users can create spots" on spots for insert
  with check (
    auth.uid() is not null
    and not (select is_banned from profiles where id = auth.uid())
  );
create policy "Creator or admin can update spots" on spots for update
  using (
    auth.uid() = created_by
    or (select role from profiles where id = auth.uid()) = 'admin'
  );
create policy "Creator or admin can delete spots" on spots for delete
  using (
    auth.uid() = created_by
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- reports
create policy "Published and clean reports are viewable" on reports for select
  using (
    status = 'published' and review_status != 'flagged'
    or (select role from profiles where id = auth.uid()) = 'admin'
    or auth.uid() = user_id
  );
create policy "Authenticated non-banned users can create reports" on reports for insert
  with check (
    auth.uid() is not null
    and not (select is_banned from profiles where id = auth.uid())
  );
create policy "Author or admin can update reports" on reports for update
  using (
    auth.uid() = user_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );
create policy "Author or admin can delete reports" on reports for delete
  using (
    auth.uid() = user_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- saved_spots
create policy "Users can view own saved spots" on saved_spots for select using (auth.uid() = user_id);
create policy "Authenticated non-banned users can save spots" on saved_spots for insert
  with check (
    auth.uid() = user_id
    and not (select is_banned from profiles where id = auth.uid())
  );
create policy "Users can delete own saved spots" on saved_spots for delete using (auth.uid() = user_id);

-- report_votes
create policy "Votes are viewable by everyone" on report_votes for select using (true);
create policy "Authenticated non-banned users can vote" on report_votes for insert
  with check (
    auth.uid() = user_id
    and not (select is_banned from profiles where id = auth.uid())
  );
create policy "Users can delete own votes" on report_votes for delete using (auth.uid() = user_id);

-- report_flags
create policy "Authenticated non-banned users can flag" on report_flags for insert
  with check (
    auth.uid() = user_id
    and not (select is_banned from profiles where id = auth.uid())
  );
create policy "Admins can view flags" on report_flags for select
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- rule_articles
create policy "Published articles are viewable by everyone" on rule_articles for select
  using (is_published = true or (select role from profiles where id = auth.uid()) = 'admin');
create policy "Only admins can manage articles" on rule_articles for all
  using ((select role from profiles where id = auth.uid()) = 'admin');
