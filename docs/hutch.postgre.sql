-- ----------------------------------------------------- --
--                PostgreSQL Database                    --
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
  hp_id SERIAL PRIMARY KEY,
  hp_sub VARCHAR(128) NOT NULL,
  hp_name VARCHAR(256),
  hp_fortune VARCHAR(512),
  hp_picture MEDIUMBLOB,
  hp_sign_kid VARCHAR(128),
  hp_deleted SMALLINT DEFAULT 0,
  hp_last_updated TIMESTAMPZ
);
CREATE INDEX i_hp_username ON h_profile(hp_sub);

-- Meta data about the safe
CREATE TABLE h_safe (
  hs_id SERIAL PRIMARY KEY,
  hp_id INT(11) NOT NULL,
  hs_name VARCHAR(128) NOT NULL,
  hs_display_name VARCHAR(512),
  hs_enc_type VARCHAR(128),
  hs_deleted SMALLINT DEFAULT 0,
  hs_last_updated TIMESTAMPZ,
  FOREIGN KEY(hp_id) REFERENCES h_profile(hp_id) ON DELETE CASCADE
);

-- Safe master key
CREATE TABLE h_key (
  hk_id SERIAL PRIMARY KEY,
  hs_id INT(11) NOT NULL,
  hk_type VARCHAR(128),
  hk_name VARCHAR(128) NOT NULL,
  hk_display_name VARCHAR(512),
  hk_data MEDIUMBLOB, --  The key is protected in a way known by the client and the user only
  hk_deleted SMALLINT DEFAULT 0,
  hk_last_updated TIMESTAMPZ,
  FOREIGN KEY(hs_id) REFERENCES h_safe(hs_id) ON DELETE CASCADE
);

-- Coin stored in the safe
CREATE TABLE h_coin (
  hc_id SERIAL PRIMARY KEY,
  hs_id INT(11) NOT NULL,
  hc_name VARCHAR(128) NOT NULL,
  hc_data MEDIUMBLOB, --  The usable data is encoded in a JWE, so only the end-user can access it if she/he has the master key
  hc_deleted SMALLINT DEFAULT 0,
  hc_last_updated TIMESTAMPZ,
  FOREIGN KEY(hs_id) REFERENCES h_safe(hs_id) ON DELETE CASCADE
);
