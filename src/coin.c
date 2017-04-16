/**
 *
 * Hutch - Password and private data locker
 *
 * coin (secret) management
 *
 * Copyright 2017 Nicolas Mora <mail@babelouest.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation;
 * version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#include "hutch.h"

json_t * coin_get_list(struct config_elements * config, const char * username, const char * safe_name) {
  json_t * j_query, * j_result, * j_return = NULL;
  int res;
  char * escaped, * clause_safe, * safe_escaped;
  
  escaped = h_escape_string(config->conn, username);
  safe_escaped = h_escape_string(config->conn, safe_name);
  clause_safe = msprintf("= (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[ss]s{sis{ssss}}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "columns",
                        "hc_name AS name",
                        "hc_data AS data",
                      "where",
                        "hc_deleted",
                        0,
                        "hs_id",
                          "operator",
                          "raw",
                          "value",
                          clause_safe);
  free(escaped);
  free(safe_escaped);
  free(clause_safe);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    j_return = json_pack("{siso}", "result", HU_OK, "coin", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_get_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * coin_get(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name) {
  json_t * j_query, * j_result, * j_return = NULL;
  int res;
  char * escaped, * clause_safe, * safe_escaped;
  
  escaped = h_escape_string(config->conn, username);
  safe_escaped = h_escape_string(config->conn, safe_name);
  clause_safe = msprintf("= (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[ss]s{sis{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "columns",
                        "hc_name AS name",
                        "hc_data AS data",
                      "where",
                        "hc_deleted",
                        0,
                        "hs_id",
                          "operator",
                          "raw",
                          "value",
                          clause_safe,
                        "hc_name",
                        coin_name);
  free(escaped);
  free(safe_escaped);
  free(clause_safe);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    if (json_array_size(j_result) > 0) {
      j_return = json_pack("{siso}", "result", HU_OK, "coin", json_copy(json_array_get(j_result, 0)));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
    json_decref(j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_get - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * is_coin_valid(struct config_elements * config, const char * username, const char * safe_name, json_t * coin, int add) {
  json_t * j_return = json_array(), * j_coin;
  
  if (j_return != NULL) {
    if (coin == NULL || !json_is_object(coin)) {
      json_array_append_new(j_return, json_pack("{ss}", "coin", "coin must be a json object"));
    } else {
      if (add) {
        if (json_object_get(coin, "name") == NULL || !json_is_string(json_object_get(coin, "name")) || json_string_length(json_object_get(coin, "name")) == 0 || json_string_length(json_object_get(coin, "name")) > 128) {
          json_array_append_new(j_return, json_pack("{ss}", "name", "name is mandatory and must be a non empty string, maximum 128 characters"));
        } else {
          j_coin = coin_get(config, username, safe_name, json_string_value(json_object_get(coin, "name")));
          if (check_result_value(j_coin, HU_OK)) {
            json_array_append_new(j_return, json_pack("{ss}", "name", "name is already taken for the current coin"));
          }
          json_decref(j_coin);
        }
      }
      
      if (json_object_get(coin, "data") == NULL || !json_is_string(json_object_get(coin, "data")) || json_string_length(json_object_get(coin, "data")) == 0 || json_string_length(json_object_get(coin, "data")) > (16*1024*1024)) {
        json_array_append_new(j_return, json_pack("{ss}", "data", "data is mandatory and must be a non empty string, maximum 16MB"));
      }
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "is_coin_valid - Error allocating resources for j_return");
  }
  return j_return;
}

int coin_add(struct config_elements * config, const char * username, const char * safe_name, json_t * coin) {
  json_t * j_query;
  int res;
  char * escaped, * clause_safe, * safe_escaped;

  escaped = h_escape_string(config->conn, username);
  safe_escaped = h_escape_string(config->conn, safe_name);
  clause_safe = msprintf("(SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss{sssss{ss}}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "values",
                        "hc_name",
                        json_string_value(json_object_get(coin, "name")),
                        "hc_data",
                        json_string_value(json_object_get(coin, "data")),
                        "hs_id",
                          "raw",
                          clause_safe);
  free(escaped);
  free(safe_escaped);
  free(clause_safe);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_add - Error executing j_query");
    return HU_ERROR_DB;
  } else {
    return HU_OK;
  }
}

int coin_set(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name, json_t * coin) {
  json_t * j_query_update, * j_query_insert;
  int res, to_return;
  char * escaped, * clause_safe, * safe_escaped;

  escaped = h_escape_string(config->conn, username);
  safe_escaped = h_escape_string(config->conn, safe_name);
  clause_safe = msprintf("= (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);
  
  j_query_update = json_pack("{sss{si}s{s{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "set",
                        "hc_deleted",
                        1,
                      "where",
                        "hs_id",
                          "operator",
                          "raw",
                          "value",
                          clause_safe,
                        "hc_name",
                        coin_name);
  free(clause_safe);
  clause_safe = msprintf("(SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);
  j_query_insert = json_pack("{sss{sssss{ss}}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "values",
                        "hc_name",
                        coin_name,
                        "hc_data",
                        json_string_value(json_object_get(coin, "data")),
                        "hs_id",
                          "raw",
                          clause_safe);
  free(escaped);
  free(safe_escaped);
  free(clause_safe);
  res = h_update(config->conn, j_query_update, NULL);
  json_decref(j_query_update);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_set - Error executing j_query_update");
    to_return = HU_ERROR_DB;
  } else {
    res = h_insert(config->conn, j_query_insert, NULL);
    json_decref(j_query_insert);
    if (res == H_OK) {
      to_return = HU_OK;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "coin_set - Error executing j_query_insert");
      to_return = HU_ERROR_DB;
    }
  }
  return to_return;
}

int coin_delete(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name) {
  json_t * j_query;
  int res;
  char * escaped, * clause_safe, * safe_escaped;

  escaped = h_escape_string(config->conn, username);
  safe_escaped = h_escape_string(config->conn, safe_name);
  clause_safe = msprintf("= (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, safe_escaped, HUTCH_TABLE_PROFILE, escaped);

  j_query = json_pack("{sss{si}s{s{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_COIN,
                      "set",
                        "hc_deleted",
                        1,
                      "where",
                        "hs_id",
                          "operator",
                          "raw",
                          "value",
                          clause_safe,
                        "hc_name",
                        coin_name);
  free(escaped);
  free(safe_escaped);
  free(clause_safe);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_delete - Error executing j_query");
    return HU_ERROR_DB;
  } else {
    return HU_OK;
  }
}

int coin_add_access_history(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name, const char * ip_address, hutch_data_access access) {
  json_t * j_query;
  int res;
  char * hc_id_clause, * escaped, * escaped_name, * escaped_safe_name;
  
  escaped_name = h_escape_string(config->conn, coin_name);
  escaped_safe_name = h_escape_string(config->conn, safe_name);
  escaped = h_escape_string(config->conn, username);
  hc_id_clause = msprintf("(SELECT `hc_id` FROM `%s` WHERE `hs_id` = (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s') AND `hc_name`='%s' AND `hc_deleted`=0))", HUTCH_TABLE_COIN, HUTCH_TABLE_SAFE, escaped_safe_name, HUTCH_TABLE_PROFILE, escaped, escaped_name);
  j_query = json_pack("{sss{sssis{ss}}}",
                      "table",
                      HUTCH_TABLE_COIN_HISTORY,
                      "values",
                        "hch_ip_source",
                        ip_address,
                        "hch_access_type",
                        access,
                        "hc_id",
                          "raw",
                          hc_id_clause);
  free(escaped);
  free(escaped_name);
  free(escaped_safe_name);
  free(hc_id_clause);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  return (res==H_OK?HU_OK:HU_ERROR_DB);
}

json_t * coin_get_history(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name) {
  json_t * j_query, * j_result, * j_element;
  int res;
  char * hc_id_clause, * escaped, * escaped_name, * escaped_safe_name;
  size_t index;

  escaped_name = h_escape_string(config->conn, coin_name);
  escaped_safe_name = h_escape_string(config->conn, safe_name);
  escaped = h_escape_string(config->conn, username);
  hc_id_clause = msprintf("= (SELECT `hc_id` FROM `%s` WHERE `hs_id` = (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')) AND `hc_name`='%s' AND `hc_deleted`=0)", HUTCH_TABLE_COIN, HUTCH_TABLE_SAFE, escaped_safe_name, HUTCH_TABLE_PROFILE, escaped, escaped_name);
  
  j_query = json_pack("{sss[sss]s{s{ssss}}}",
                      "table",
                      HUTCH_TABLE_COIN_HISTORY,
                      "columns",
                        config->conn->type==HOEL_DB_TYPE_MARIADB?"UNIX_TIMESTAMP(hch_date_access) AS date":"hch_date_access AS date",
                        "hch_ip_source AS ip_source",
                        "hch_access_type",
                      "where",
                        "hc_id",
                          "operator",
                          "raw",
                          "value",
                          hc_id_clause);
  free(escaped);
  free(escaped_name);
  free(escaped_safe_name);
  free(hc_id_clause);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    json_array_foreach(j_result, index, j_element) {
      if (json_integer_value(json_object_get(j_element, "hch_access_type")) == access_read) {
        json_object_set_new(j_element, "access_type", json_string("read"));
      } else if (json_integer_value(json_object_get(j_element, "hch_access_type")) == access_update) {
        json_object_set_new(j_element, "access_type", json_string("update"));
      } else if (json_integer_value(json_object_get(j_element, "hch_access_type")) == access_history) {
        json_object_set_new(j_element, "access_type", json_string("history"));
      }
      json_object_del(j_element, "hch_access_type");
    }
    j_result= json_pack("{siso}", "result", HU_OK, "history", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_get_history - Error executing j_query");
    j_result = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_result;
}
