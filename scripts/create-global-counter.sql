-- Create global counter table
CREATE TABLE IF NOT EXISTS global_counter (
  id INTEGER PRIMARY KEY,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial record if it doesn't exist
INSERT OR IGNORE INTO global_counter (id, total_clicks) VALUES (1, 0);
