/**
 *
 * Hutch - Password and private data locker
 *
 * Safe key management
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

json_t * safe_key_list(struct config_elements * config, json_t * j_profile, const char * safe) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sssss]s{sIsi}}",
                      "table", HUTCH_TABLE_KEY,
                      "columns",
                        "hk_type AS type",
                        "hk_name AS name",
                        "hk_display_name AS display_name",
                        "hk_data AS data",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hk_last_updated) AS last_updated", "hk_last_updated AS last_updated", "EXTRACT(EPOCH FROM hk_last_updated)::integer AS last_updated"),
                      "where",
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hk_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    j_return = json_pack("{sis{so}}", "result", HU_OK, "key", "list", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * safe_key_get(struct config_elements * config, json_t * j_profile, const char * safe, const char * name) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sssss]s{sIsssi}}",
                      "table", HUTCH_TABLE_KEY,
                      "columns",
                        "hk_type AS type",
                        "hk_name AS name",
                        "hk_display_name AS display_name",
                        "hk_data AS data",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hk_last_updated) AS last_updated", "hk_last_updated AS last_updated", "EXTRACT(EPOCH FROM hk_last_updated)::integer AS last_updated"),
                      "where",
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hk_name", name,
                        "hk_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    if (json_array_size(j_result)) {
      j_return = json_pack("{sisO}", "result", HU_OK, "key", json_array_get(j_result, 0));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
    json_decref(j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_get - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * safe_key_is_valid(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_safe_key, int add) {
  json_t * j_return, * j_error = json_array(), * j_cur_safe_key;
  int ret;
  
  if (j_error != NULL) {
    if (json_is_object(j_safe_key)) {
      ret = HU_OK;
      if (add) {
        if (!json_string_length(json_object_get(j_safe_key, "name")) || json_string_length(json_object_get(j_safe_key, "name")) > 128) {
          ret = HU_ERROR_PARAM;
          json_array_append_new(j_error, json_string("name must be a string of maximum 128 characters"));
        } else {
          j_cur_safe_key = safe_key_get(config, j_profile, safe, json_string_value(json_object_get(j_safe_key, "name")));
          if (check_result_value(j_cur_safe_key, HU_OK)) {
            ret = HU_ERROR_PARAM;
            json_array_append_new(j_error, json_string("name already exist for a safe key"));
          } else if (!check_result_value(j_cur_safe_key, HU_ERROR_NOT_FOUND)) {
            y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_is_valid - Error safe_get");
            ret = H_ERROR;
            json_array_append_new(j_error, json_string("Internal error"));
          }
          json_decref(j_cur_safe_key);
        }
      }
      if (json_object_get(j_safe_key, "display_name") != NULL && (!json_is_string(json_object_get(j_safe_key, "display_name")) || json_string_length(json_object_get(j_safe_key, "display_name")) > 512)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("display_name must be a string of maximum 512 characters"));
      }
      if (json_object_get(j_safe_key, "type") != NULL && (!json_is_string(json_object_get(j_safe_key, "type")) || json_string_length(json_object_get(j_safe_key, "type")) > 128)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("type must be a string of maximum 128 characters"));
      }
      if (o_strnullempty(json_string_value(json_object_get(j_safe_key, "data"))) || json_string_length(json_object_get(j_safe_key, "data")) > 16*1024*1024) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("data must be a string of maximum 16M characters"));
      }
    } else {
      ret = HU_ERROR_PARAM;
      json_array_append_new(j_error, json_string("safe key must be a JSON object"));
    }
    if (ret == HU_OK) {
      j_return = json_pack("{si}", "result", HU_OK);
    } else {
      j_return = json_pack("{sisO}", "result", ret, "error", j_error);
    }
    json_decref(j_error);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_is_valid - Error allocating resources for j_error");
    j_return = json_pack("{si}", "result", HU_ERROR_MEMORY);
  }
  
  return j_return;
}

int safe_key_add(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_safe_key) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sOsO?sO?sOs{ss}sI}}",
                      "table", HUTCH_TABLE_KEY,
                      "values",
                        "hk_name", json_object_get(j_safe_key, "name"),
                        "hk_display_name", json_object_get(j_safe_key, "display_name"),
                        "hk_type", json_object_get(j_safe_key, "type"),
                        "hk_data", json_object_get(j_safe_key, "data"),
                        "hk_last_updated",
                          "raw",
                          str_now,
                        "hs_id", safe_get_id(config, j_profile, safe));
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_add - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int safe_key_set(struct config_elements * config, json_t * j_profile, const char * safe, const char * name, json_t * j_safe_key) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sO?sO?sOs{ss}}s{sssIsi}}",
                      "table", HUTCH_TABLE_KEY,
                      "set",
                        "hk_display_name", json_object_get(j_safe_key, "display_name"),
                        "hk_type", json_object_get(j_safe_key, "type"),
                        "hk_data", json_object_get(j_safe_key, "data"),
                        "hk_last_updated",
                          "raw",
                          str_now,
                      "where",
                        "hk_name", name,
                        "hs_id", safe_get_id(config, j_profile, safe),
                        "hk_deleted", 0);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_set - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int safe_key_delete(struct config_elements * config, json_t * j_profile, const char * safe, const char * name) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];

  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sis{ss}}s{sssI}}",
                      "table", HUTCH_TABLE_KEY,
                      "set",
                        "hk_deleted", 1,
                        "hk_last_updated",
                          "raw",
                          str_now,
                      "where",
                        "hk_name", name,
                        "hs_id", safe_get_id(config, j_profile, safe));
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_key_delete - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}
