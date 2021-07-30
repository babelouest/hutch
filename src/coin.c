/**
 *
 * Hutch - Password and private data locker
 *
 * Safe coin management
 *
 * Copyright 2017-2021 Nicolas Mora <mail@babelouest.org>
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

json_t * coin_list(struct config_elements * config, json_t * j_profile, const char * safe) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sss]s{sIsi}}",
                      "table", HUTCH_TABLE_COIN,
                      "columns",
                        "hc_name AS name",
                        "hc_data AS data",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hc_last_updated) AS last_updated", "hc_last_updated AS last_updated", "EXTRACT(EPOCH FROM hc_last_updated)::integer AS last_updated"),
                      "where",
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hc_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    j_return = json_pack("{sis{so}}", "result", HU_OK, "coin", "list", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * coin_get(struct config_elements * config, json_t * j_profile, const char * safe, const char * name) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sss]s{sIsssi}}",
                      "table", HUTCH_TABLE_COIN,
                      "columns",
                        "hc_name AS name",
                        "hc_data AS data",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hc_last_updated) AS last_updated", "hc_last_updated AS last_updated", "EXTRACT(EPOCH FROM hc_last_updated)::integer AS last_updated"),
                      "where",
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hc_name", name,
                        "hc_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    if (json_array_size(j_result)) {
      j_return = json_pack("{sisO}", "result", HU_OK, "coin", json_array_get(j_result, 0));
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

json_t * coin_is_valid(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_coin, int add) {
  json_t * j_return, * j_error = json_array(), * j_cur_coin;
  int ret;
  
  if (j_error != NULL) {
    if (json_is_object(j_coin)) {
      ret = HU_OK;
      if (add) {
        if (!json_string_length(json_object_get(j_coin, "name")) || json_string_length(json_object_get(j_coin, "name")) > 128) {
          ret = HU_ERROR_PARAM;
          json_array_append_new(j_error, json_string("name must be a string of maximum 128 characters"));
        } else {
          j_cur_coin = coin_get(config, j_profile, safe, json_string_value(json_object_get(j_coin, "name")));
          if (check_result_value(j_cur_coin, HU_OK)) {
            ret = HU_ERROR_PARAM;
            json_array_append_new(j_error, json_string("name already exist for a safe coin"));
          } else if (!check_result_value(j_cur_coin, HU_ERROR_NOT_FOUND)) {
            y_log_message(Y_LOG_LEVEL_ERROR, "coin_is_valid - Error safe_get");
            ret = H_ERROR;
            json_array_append_new(j_error, json_string("Internal error"));
          }
          json_decref(j_cur_coin);
        }
      }
      if (!json_string_length(json_object_get(j_coin, "data")) || json_string_length(json_object_get(j_coin, "data")) > 16*1024*1024) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("data must be a string of maximum 16M characters"));
      }
    } else {
      ret = HU_ERROR_PARAM;
      json_array_append_new(j_error, json_string("safe coin must be a JSON object"));
    }
    if (ret == HU_OK) {
      j_return = json_pack("{si}", "result", HU_OK);
    } else {
      j_return = json_pack("{sisO}", "result", ret, "error", j_error);
    }
    json_decref(j_error);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_is_valid - Error allocating resources for j_error");
    j_return = json_pack("{si}", "result", HU_ERROR_MEMORY);
  }
  
  return j_return;
}

int coin_add(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_coin) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sOsO?s{ss}sI}}",
                      "table", HUTCH_TABLE_COIN,
                      "values",
                        "hc_name", json_object_get(j_coin, "name"),
                        "hc_data", json_object_get(j_coin, "data"),
                        "hc_last_updated",
                          "raw", str_now,
                        "hs_id", safe_get_id(config, j_profile, safe));
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_add - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int coin_set(struct config_elements * config, json_t * j_profile, const char * safe, const char * name, json_t * j_coin) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sO?s{ss}}s{sssIsi}}",
                      "table", HUTCH_TABLE_COIN,
                      "set",
                        "hc_data", json_object_get(j_coin, "data"),
                        "hc_last_updated",
                          "raw", str_now,
                      "where",
                        "hc_name", name,
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hc_deleted", 0);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_set - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int coin_delete(struct config_elements * config, json_t * j_profile, const char * safe, const char * name) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sis{ss}}s{sssI}}",
                      "table", HUTCH_TABLE_COIN,
                      "set",
                        "hc_deleted", 1,
                        "hc_last_updated",
                          "raw",
                          str_now,
                      "where",
                        "hc_name", name,
                        "hs_id", safe_get_id(config, j_profile, safe));
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "coin_delete - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}
