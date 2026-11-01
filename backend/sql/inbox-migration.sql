ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS inbox_read_at timestamptz;

CREATE INDEX IF NOT EXISTS messages_inbox_incoming_idx
  ON public.messages (organization_id, message_timestamp DESC)
  WHERE direction = 'incoming';

CREATE INDEX IF NOT EXISTS messages_inbox_unread_idx
  ON public.messages (organization_id, contact_id)
  WHERE direction = 'incoming' AND inbox_read_at IS NULL;