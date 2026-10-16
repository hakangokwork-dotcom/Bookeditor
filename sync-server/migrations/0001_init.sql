-- inkGuide eşitleme: hesaplar, oturumlar, şifreli kitaplar
CREATE TABLE users (
  username     TEXT PRIMARY KEY,
  auth_hash    TEXT NOT NULL,              -- SHA-256(istemcinin şifreden türettiği authKey)
  rec_hash     TEXT NOT NULL,              -- SHA-256(kurtarma anahtarından türetilen recAuth)
  wrapped_p    TEXT NOT NULL,              -- kitap anahtarı, şifreden türetilen anahtarla şifreli
  wrapped_r    TEXT NOT NULL,              -- kitap anahtarı, kurtarma anahtarıyla şifreli
  created_at   INTEGER NOT NULL,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (username);

CREATE TABLE books (
  username   TEXT NOT NULL,
  id         TEXT NOT NULL,                -- istemcinin verdiği UUID
  rev        INTEGER NOT NULL,
  data       TEXT,                         -- base64(iv + AES-GCM(gzip(JSON))) — sunucu okuyamaz
  deleted    INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (username, id)
);
