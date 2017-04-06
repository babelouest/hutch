-- SQlite3 init script

DROP TABLE IF EXISTS `h_coin_history`;
DROP TABLE IF EXISTS `h_safe_history`;
DROP TABLE IF EXISTS `h_profile_history`;
DROP TABLE IF EXISTS `h_coin`;
DROP TABLE IF EXISTS `h_safe`;
DROP TABLE IF EXISTS `h_profile`;

-- Contain a user profile with a message and a picture choosen by the user to authenticate the server
CREATE TABLE `h_profile` (
  `hp_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hp_username` TEXT NOT NULL,
  `hp_fortune` TEXT NOT NULL,
  `hp_picture` TEXT
);
CREATE INDEX `i_hp_username` ON `h_profile`(`hp_username`);

-- Meta data about the safe
CREATE TABLE `h_safe` (
  `hs_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hp_id` INTEGER NOT NULL,
  `hs_name` TEXT NOT NULL,
  `hs_description` TEXT,
  `hs_key` TEXT NOT NULL,
  FOREIGN KEY(`hp_id`) REFERENCES `h_profile`(`hp_id`) ON DELETE CASCADE
);

-- Coin stored in the safe
CREATE TABLE `h_coin` (
  `hc_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hs_id` INTEGER NOT NULL,
  `hc_name` TEXT NOT NULL,
  `hc_data` TEXT, --  The usable data is encoded in a blob, so only the end-user can access it if she/he remembers the master password
  `hc_deleted` INTEGER DEFAULT 0,
  FOREIGN KEY(`hs_id`) REFERENCES `h_safe`(`hs_id`) ON DELETE CASCADE
);

-- Profile history access
CREATE TABLE `h_profile_history` (
  `hph_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hp_id` INTEGER NOT NULL,
  `hph_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hph_ip_source` TEXT NOT NULL,
  `hph_access_type` INTEGER NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE, 3: DELETE, 4: UPDATE FORTUNE, 5: UPDATE PICTURE
  FOREIGN KEY(`hp_id`) REFERENCES `h_profile`(`hp_id`)
);

-- Safe history access
CREATE TABLE `h_safe_history` (
  `hsh_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hs_id` INTEGER NOT NULL,
  `hsh_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hsh_ip_source` TEXT NOT NULL,
  `hsh_access_type` INTEGER NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE, 3: DELETE, 4: UPDATE KEY
  FOREIGN KEY(`hs_id`) REFERENCES `h_safe`(`hs_id`)
);

-- Coin history access
CREATE TABLE `h_coin_history` (
  `hch_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `hc_id` INTEGER NOT NULL,
  `hch_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hch_ip_source` TEXT NOT NULL,
  `hch_access_type` INTEGER NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE, 3: DELETE
  FOREIGN KEY(`hc_id`) REFERENCES `h_coin`(`hc_id`)
);
