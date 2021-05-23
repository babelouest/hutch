/**
 *
 * Hutch - Password and private data locker
 *
 * Safe management
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

json_t * safe_list(struct config_elements * config, json_t * j_profile) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sssss]s{sO}}",
                      "table", HUTCH_TABLE_SAFE,
                      "columns",
                        "hs_id",
                        "hs_name AS name",
                        "hs_display_name AS display_name",
                        "hs_enc_type AS enc_type",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hs_last_updated) AS last_updated", "hs_last_updated AS last_updated", "EXTRACT(EPOCH FROM hs_last_updated)::integer AS last_updated"),
                      "where",
                        "hp_id", json_object_get(j_profile, "hp_id"));
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    j_return = json_pack("{siso}", "result", HU_OK, "safe", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * safe_get(struct config_elements * config, json_t * j_profile, const char * name) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[sssss]s{sOsssi}}",
                      "table", HUTCH_TABLE_SAFE,
                      "columns",
                        "hs_id",
                        "hs_name AS name",
                        "hs_display_name AS display_name",
                        "hs_enc_type AS enc_type",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hs_last_updated) AS last_updated", "hs_last_updated AS last_updated", "EXTRACT(EPOCH FROM hs_last_updated)::integer AS last_updated"),
                      "where",
                        "hp_id", json_object_get(j_profile, "hp_id"),
                        "hs_name", name,
                        "hs_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    if (json_array_size(j_result)) {
      j_return = json_pack("{sisO}", "result", HU_OK, "safe", json_array_get(j_result, 0));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
    json_decref(j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * safe_is_valid(struct config_elements * config, json_t * j_profile, json_t * j_safe, int add) {
  json_t * j_return, * j_error = json_array(), * j_cur_safe;
  int ret;
  
  if (j_error != NULL) {
    if (json_is_object(j_safe)) {
      ret = HU_OK;
      if (add) {
        if (!json_string_length(json_object_get(j_safe, "name")) || json_string_length(json_object_get(j_safe, "name")) > 128) {
          ret = HU_ERROR_PARAM;
          json_array_append_new(j_error, json_string("name must be a string of maximum 128 characters"));
        } else {
          j_cur_safe = safe_get(config, j_profile, json_string_value(json_object_get(j_safe, "name")));
          if (check_result_value(j_cur_safe, HU_OK)) {
            ret = HU_ERROR_PARAM;
            json_array_append_new(j_error, json_string("name already exist for a safe"));
          } else if (!check_result_value(j_cur_safe, HU_ERROR_NOT_FOUND)) {
            y_log_message(Y_LOG_LEVEL_ERROR, "safe_is_valid - Error safe_get");
            ret = H_ERROR;
            json_array_append_new(j_error, json_string("Internal error"));
          }
          json_decref(j_cur_safe);
        }
      }
      if (json_object_get(j_safe, "display_name") != NULL && (!json_is_string(json_object_get(j_safe, "display_name")) || json_string_length(json_object_get(j_safe, "display_name")) > 512)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("display_name must be a string of maximum 512 characters"));
      }
      if (json_object_get(j_safe, "enc_type") != NULL && (!json_is_string(json_object_get(j_safe, "enc_type")) || json_string_length(json_object_get(j_safe, "enc_type")) > 128)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("enc_type must be a string of maximum 128 characters"));
      }
    } else {
      ret = HU_ERROR_PARAM;
      json_array_append_new(j_error, json_string("safe must be a JSON object"));
    }
    if (ret == HU_OK) {
      j_return = json_pack("{si}", "result", HU_OK);
    } else {
      j_return = json_pack("{sisO}", "result", ret, "error", j_error);
    }
    json_decref(j_error);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_is_valid - Error allocating resources for j_error");
    j_return = json_pack("{si}", "result", HU_ERROR_MEMORY);
  }
  
  return j_return;
}

int safe_add(struct config_elements * config, json_t * j_profile, json_t * j_safe) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];
  
  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sOsO?sO?sOs{ss}}}",
                      "table", HUTCH_TABLE_SAFE,
                      "values",
                        "hs_name", json_object_get(j_safe, "name"),
                        "hs_display_name", json_object_get(j_safe, "display_name"),
                        "hs_enc_type", json_object_get(j_safe, "enc_type"),
                        "hp_id", json_object_get(j_profile, "hp_id"),
                        "hs_last_updated",
                          "raw",
                          str_now);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_add - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int safe_set(struct config_elements * config, json_t * j_profile, const char * name, json_t * j_safe) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];
  
  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sO?sO?s{ss}}s{sssOsi}}",
                      "table", HUTCH_TABLE_SAFE,
                      "set",
                        "hs_display_name", json_object_get(j_safe, "display_name"),
                        "hs_enc_type", json_object_get(j_safe, "enc_type"),
                        "hs_last_updated",
                          "raw",
                          str_now,
                      "where",
                        "hs_name", name,
                        "hp_id", json_object_get(j_profile, "hp_id"),
                        "hs_deleted", 0);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_set - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

int safe_delete(struct config_elements * config, json_t * j_profile, const char * name) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];
  
  time(&now); 
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sis{ss}}s{sssO}}",
                      "table", HUTCH_TABLE_SAFE,
                      "set",
                        "hs_deleted", 1,
                        "hs_last_updated",
                          "raw",
                          str_now,
                      "where",
                        "hs_name", name,
                        "hp_id", json_object_get(j_profile, "hp_id"));
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_delete - Error executing j_query");
    ret = HU_ERROR_DB;
  }
  return ret;
}

json_int_t safe_get_id(struct config_elements * config, json_t * j_profile, const char * safe) {
  json_t * j_safe = safe_get(config, j_profile, safe);
  json_int_t ret = 0;
  
  if (check_result_value(j_safe, HU_OK)) {
    ret = json_integer_value(json_object_get(json_object_get(j_safe, "safe"), "hs_id"));
  } else if (!check_result_value(j_safe, HU_ERROR_NOT_FOUND)) {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_get_id - Error safe_get");
  }
  json_decref(j_safe);
  return ret;
}
