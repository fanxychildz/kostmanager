CREATE TABLE IF NOT EXISTS chat_messages (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  read integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_messages_tenant_idx ON chat_messages(tenant_id, created_at);