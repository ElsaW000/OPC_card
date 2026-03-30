CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_default_per_user
  ON cards(user_id)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_card_projects_card_sort
  ON card_projects(card_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_card_videos_card_sort
  ON card_videos(card_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_card_custom_blocks_card_sort
  ON card_custom_blocks(card_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_contacts_owner_status_updated
  ON contacts(owner_user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitors_owner_last_visit
  ON visitors(owner_user_id, last_visit_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_records_requester_created
  ON exchange_records(requester_user_id, created_at DESC);
