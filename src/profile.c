/**
 *
 * Hutch - Password and private data locker
 *
 * Webservices management
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

json_t * profile_get(struct config_elements * config, const char * sub) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[ssssss]s{sssi}}",
                      "table", HUTCH_TABLE_PROFILE,
                      "columns",
                        "hp_id",
                        "hp_name AS name",
                        "hp_message AS message",
                        "hp_picture AS picture",
                        "hp_sign_kid AS sign_kid",
                        SWITCH_DB_TYPE(config->conn->type, "UNIX_TIMESTAMP(hp_last_updated) AS last_updated", "hp_last_updated AS last_updated", "EXTRACT(EPOCH FROM hp_last_updated)::integer AS last_updated"),
                      "where",
                        "hp_sub", sub,
                        "hp_deleted", 0);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    if (json_array_size(j_result)) {
      j_return = json_pack("{sisO}", "result", HU_OK, "profile", json_array_get(j_result, 0));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
    json_decref(j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_get - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * profile_is_valid(struct config_elements * config, json_t * j_profile) {
  json_t * j_return, * j_error = json_array();
  int ret;
  jwk_t * jwk = NULL;
  
  if (j_error != NULL) {
    if (json_is_object(j_profile)) {
      ret = HU_OK;
      if (json_object_get(j_profile, "name") != NULL && (!json_is_string(json_object_get(j_profile, "name")) || json_string_length(json_object_get(j_profile, "name")) > 256)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("name must be a string of maximum 256 characters"));
      }
      if (json_object_get(j_profile, "message") != NULL && (!json_is_string(json_object_get(j_profile, "message")) || json_string_length(json_object_get(j_profile, "message")) > 512)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("message must be a string of maximum 256 characters"));
      }
      if (json_object_get(j_profile, "picture") != NULL && (!json_is_string(json_object_get(j_profile, "picture")) || json_string_length(json_object_get(j_profile, "picture")) > 1024*1024*16)) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("picture must be a string of maximum 16M characters"));
      }
      if (json_object_get(j_profile, "sign_kid") != NULL && (jwk = r_jwks_get_by_kid(config->sign_key, json_string_value(json_object_get(j_profile, "sign_kid")))) == NULL) {
        ret = HU_ERROR_PARAM;
        json_array_append_new(j_error, json_string("invalid kid"));
      }
      r_jwk_free(jwk);
    } else {
      ret = HU_ERROR_PARAM;
      json_array_append_new(j_error, json_string("profile must be a JSON object"));
    }
    if (ret == HU_OK) {
      j_return = json_pack("{si}", "result", HU_OK);
    } else {
      j_return = json_pack("{sisO}", "result", ret, "error", j_error);
    }
    json_decref(j_error);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_is_valid - Error allocating resources for j_error");
    j_return = json_pack("{si}", "result", HU_ERROR_MEMORY);
  }
  
  return j_return;
}

int profile_set(struct config_elements * config, const char * sub, json_t * j_profile) {
  json_t * j_query, * j_cur_profile;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];
  
  j_cur_profile = profile_get(config, sub);
  
  if (check_result_value(j_cur_profile, HU_OK)) {
    time(&now);
    snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
    j_query = json_pack("{ss s{sO? sO? sO? sO? s{ss}} s{sO}}",
                        "table", HUTCH_TABLE_PROFILE,
                        "set",
                          "hp_name", json_object_get(j_profile, "name"),
                          "hp_message", json_object_get(j_profile, "message"),
                          "hp_picture", json_object_get(j_profile, "picture"),
                          "hp_sign_kid", json_object_get(j_profile, "sign_kid"),
                          "hp_last_updated", 
                            "raw",
                            str_now,
                          "where",
                            "hp_id", json_object_get(json_object_get(j_cur_profile, "profile"), "hp_id"));
    res = h_update(config->conn, j_query, NULL);
    json_decref(j_query);
    if (res == H_OK) {
      ret = HU_OK;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "profile_set - Error Error executing j_query (1)");
      ret = HU_ERROR_DB;
    }
  } else if (check_result_value(j_cur_profile, HU_ERROR_NOT_FOUND)) {
    time(&now);
    snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
    j_query = json_pack("{ss s{sO? sO? sO? sO? ss s{ss}}}",
                        "table", HUTCH_TABLE_PROFILE,
                        "values",
                          "hp_name", json_object_get(j_profile, "name"),
                          "hp_message", json_object_get(j_profile, "message"),
                          "hp_picture", json_object_get(j_profile, "picture"),
                          "hp_sign_kid", json_object_get(j_profile, "sign_kid"),
                          "hp_sub", sub,
                          "hp_last_updated", 
                            "raw",
                            str_now);
    res = h_insert(config->conn, j_query, NULL);
    json_decref(j_query);
    if (res == H_OK) {
      ret = HU_OK;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "profile_set - Error Error executing j_query (2)");
      ret = HU_ERROR_DB;
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_set - Error profile_get");
    ret = HU_ERROR;
  }
  json_decref(j_cur_profile);
  return ret;
}

int profile_delete(struct config_elements * config, const char * sub) {
  json_t * j_query;
  int res, ret;
  time_t now;
  char str_now[EPOCH_STR_FORMAT+1];
  
  time(&now);
  snprintf(str_now, EPOCH_STR_FORMAT, "%s%lu)", (SWITCH_DB_TYPE(config->conn->type, "FROM_UNIXTIME(", "(", "TO_TIMESTAMP(")), now);
  j_query = json_pack("{sss{sis{ss}}s{ss}}",
                      "table", HUTCH_TABLE_PROFILE,
                      "set",
                        "hp_deleted", 1,
                        "hp_last_updated", 
                          "raw",
                          str_now,
                      "where",
                        "hp_sub", sub);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    ret = HU_OK;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_set - Error Error executing j_query (1)");
    ret = HU_ERROR_DB;
  }
  return ret;
}
