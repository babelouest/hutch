-- Mysql/MariaDB init script
-- Create database and user
-- CREATE DATABASE `hutch`;
-- GRANT ALL PRIVILEGES ON hutch.* TO 'hutch'@'%' identified BY 'hutch';
-- FLUSH PRIVILEGES;
-- USE `hutch`;

DROP TABLE IF EXISTS `h_coin_history`;
DROP TABLE IF EXISTS `h_data_history`;
DROP TABLE IF EXISTS `h_profile_history`;
DROP TABLE IF EXISTS `h_coin`;
DROP TABLE IF EXISTS `h_safe`;
DROP TABLE IF EXISTS `h_profile`;

-- Contain a user profile with a message and a picture choosen by the user to authenticate the server
CREATE TABLE `h_profile` (
  `hp_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hp_username` VARCHAR(128) NOT NULL,
  `hp_fortune` VARCHAR(512) NOT NULL,
  `hp_picture` BLOB
);
CREATE INDEX `i_hp_username` ON `h_profile`(`hp_username`);

-- Meta data about the safe
CREATE TABLE `h_safe` (
  `hs_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hp_id` INT(11) NOT NULL,
  `hs_name` VARCHAR(128) NOT NULL,
  `hs_description` VARCHAR(512),
  `hs_key` VARCHAR(512) NOT NULL,
  `hs_deleted` TINYINT DEFAULT 0,
  FOREIGN KEY(`hp_id`) REFERENCES `h_profile`(`hp_id`) ON DELETE CASCADE
);

-- Coin stored in the safe
CREATE TABLE `h_coin` (
  `hc_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hs_id` INT(11) NOT NULL,
  `hc_name` VARCHAR(128) NOT NULL,
  `hc_data` BLOB, --  The usable data is encoded in a blob, so only the end-user can access it if she/he has the master password
  `hc_deleted` TINYINT DEFAULT 0,
  FOREIGN KEY(`hs_id`) REFERENCES `h_safe`(`hs_id`) ON DELETE CASCADE
);

-- Profile history access
CREATE TABLE `h_profile_history` (
  `hph_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hp_id` INT(11) NOT NULL,
  `hph_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hph_ip_source` VARCHAR(64) NOT NULL,
  `hph_access_type` TINYINT NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE FORTUNE, 3: UPDATE PICTURE, 4: DELETE
  FOREIGN KEY(`hp_id`) REFERENCES `h_profile`(`hp_id`)
);

-- Safe history access
CREATE TABLE `h_safe_history` (
  `hsh_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hs_id` INT(11) NOT NULL,
  `hsh_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hsh_ip_source` VARCHAR(64) NOT NULL,
  `hsh_access_type` TINYINT NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE NAME, 3 UPDATE DESCRIPTION, 4: UPDATE KEY, 5: DELETE
  FOREIGN KEY(`hs_id`) REFERENCES `h_safe`(`hs_id`)
);

-- Coin history access
CREATE TABLE `h_coin_history` (
  `hch_id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `hc_id` INT(11) NOT NULL,
  `hch_date_access` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `hch_ip_source` VARCHAR(64) NOT NULL,
  `hch_access_type` TINYINT NOT NULL, -- 0: CREATE, 1: READ, 2: UPDATE, 3: DELETE
  FOREIGN KEY(`hc_id`) REFERENCES `h_coin`(`hc_id`)
);
