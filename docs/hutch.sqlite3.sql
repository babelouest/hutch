-- ----------------------------------------------------- --
--                SQLite3 Database                       --
-- Initialize Hutch Database for the backend server      --
-- The administration client app                         --
-- Copyright 2021 Nicolas Mora <mail@babelouest.org>     --
-- License: MIT                                          --
-- ----------------------------------------------------- --

DROP TABLE IF EXISTS h_coin;
DROP TABLE IF EXISTS h_key;
DROP TABLE IF EXISTS h_safe;
DROP TABLE IF EXISTS h_profile;

-- Contain a user profile with a message and a picture choosen by the user to authenticate the server
CREATE TABLE h_profile (
  hp_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hp_sub TEXT NOT NULL,
  hp_name TEXT,
  hp_message TEXT,
  hp_picture TEXT,
  hp_sign_kid TEXT,
  hp_deleted INTEGER DEFAULT 0,
  hp_last_updated TIMESTAMP
);
CREATE INDEX i_hp_username ON h_profile(hp_sub);

-- Meta data about the safe
CREATE TABLE h_safe (
  hs_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hp_id INTEGER NOT NULL,
  hs_name TEXT NOT NULL,
  hs_display_name TEXT,
  hs_enc_type TEXT,
  hs_alg_type TEXT,
  hs_deleted INTEGER DEFAULT 0,
  hs_last_updated TIMESTAMP,
  FOREIGN KEY(hp_id) REFERENCES h_profile(hp_id) ON DELETE CASCADE
);

-- Safe master key
CREATE TABLE h_key (
  hk_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hs_id INTEGER NOT NULL,
  hk_type TEXT,
  hk_name TEXT NOT NULL,
  hk_display_name TEXT,
  hk_data TEXT, --  The key is protected in a way known by the client and the user only
  hk_deleted INTEGER DEFAULT 0,
  hk_last_updated TIMESTAMP,
  FOREIGN KEY(hs_id) REFERENCES h_safe(hs_id) ON DELETE CASCADE
);

-- Coin stored in the safe
CREATE TABLE h_coin (
  hc_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hs_id INTEGER NOT NULL,
  hc_name TEXT NOT NULL,
  hc_data TEXT, --  The usable data is encoded in a JWE, so only the end-user can access it if she/he has the master key
  hc_deleted INTEGER DEFAULT 0,
  hc_last_updated TIMESTAMP,
  FOREIGN KEY(hs_id) REFERENCES h_safe(hs_id) ON DELETE CASCADE
);
