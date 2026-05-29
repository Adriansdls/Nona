-- WS-E: store the Nona Page post id of a case so the owner can boost THAT exact
-- post from their own Facebook (owner-pays model). Nullable — only set when the
-- Page auto-post succeeds (needs FACEBOOK_PAGE_ACCESS_TOKEN + FACEBOOK_PAGE_ID).
alter table cases add column if not exists fb_post_id text;

comment on column cases.fb_post_id is
  'WS-E: Nona Page post id (Graph) for owner-boost deep-link; null until the Page auto-post succeeds.';
