-- Seed default admin account
-- Email: admin@admin
-- Password: admin (PBKDF2-SHA256 hashed)

INSERT OR REPLACE INTO users (id, email, password, name, role, created_at, updated_at)
VALUES (
  'admin-001',
  'admin@admin',
  '100000$64384a8744532201efed23d80c609f75$e25dfd7e24cf91fbebd1d101f46a6e7c7b346261000c3fe82e07dd7a86c28bacfb7924c43656e5a1b47a4a27d6c5aeddcad224055aaee580a5dbf2f2ee23a284',
  'Admin',
  'admin',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
