/**
 *
 * Hutch - Password and private data locker
 *
 * Profile management
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

int profile_add_access_history(struct config_elements * config, const char * username, const char * ip_address, hutch_data_access access) {
  json_t * j_query;
  int res;
  char * hp_id_clause, * escaped;
  
  escaped = h_escape_string(config->conn, username);
  hp_id_clause = msprintf("(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  j_query = json_pack("{sss{sssis{ss}}}",
                      "table",
                      HUTCH_TABLE_PROFILE_HISTORY,
                      "values",
                        "hph_ip_source",
                        ip_address,
                        "hph_access_type",
                        access,
                        "hp_id",
                          "raw",
                          hp_id_clause);
  free(escaped);
  free(hp_id_clause);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  return (res==H_OK?HU_OK:HU_ERROR_DB);
}

json_t * profile_get(struct config_elements * config, const char * username) {
  json_t * j_query, * j_result, * j_return;
  int res;
  
  j_query = json_pack("{sss[ss]s{ss}}",
                      "table",
                      HUTCH_TABLE_PROFILE,
                      "columns",
                        "hp_fortune AS fortune",
                        "hp_picture AS picture",
                      "where",
                        "hp_username",
                        username);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    if (json_array_size(j_result) > 0) {
      j_return = json_pack("{siso}", "result", HU_OK, "profile", json_copy(json_array_get(j_result, 0)));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_get - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  json_decref(j_result);
  return j_return;
}

json_t * is_profile_valid(json_t * profile) {
  json_t * j_result= json_array();
  
  if (j_result != NULL) {
    if (!json_is_object(profile)) {
      json_array_append_new(j_result, json_pack("{ss}", "profile", "profile must be a json object"));
    } else {
      if (!json_is_string(json_object_get(profile, "fortune")) || json_string_length(json_object_get(profile, "fortune")) == 0 || json_string_length(json_object_get(profile, "fortune")) > 512) {
        json_array_append_new(j_result, json_pack("{ss}", "fortune", "fortune must be a non empty string, maximum 512 characters"));
      }
      
      if (!json_is_string(json_object_get(profile, "picture")) || json_string_length(json_object_get(profile, "picture")) == 0 || json_string_length(json_object_get(profile, "picture")) > (16*1024*1024)) {
        json_array_append_new(j_result, json_pack("{ss}", "picture", "picture must be a non empty string, maximum 16MB"));
      }
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "is_profile_valid - Error allocating resources for j_result");
  }
  return j_result;
}

int profile_set(struct config_elements * config, const char * username, json_t * profile) {
  json_t * j_query = NULL, * cur_profile = profile_get(config, username);
  int res, to_return;
  
  if (check_result_value(cur_profile, HU_OK)) {
    j_query = json_pack("{sss{ssss}s{ss}}",
                        "table",
                        HUTCH_TABLE_PROFILE,
                        "set",
                          "hp_fortune",
                          json_string_value(json_object_get(profile, "fortune")),
                          "hp_picture",
                          json_string_value(json_object_get(profile, "picture")),
                        "where",
                          "hp_username",
                          username);
    res = h_update(config->conn, j_query, NULL);
    json_decref(j_query);
    to_return = (res==H_OK?HU_OK:HU_ERROR_DB);
  } else if (check_result_value(cur_profile, HU_ERROR_NOT_FOUND)) {
    j_query = json_pack("{sss{ssssss}}",
                        "table",
                        HUTCH_TABLE_PROFILE,
                        "values",
                          "hp_fortune",
                          json_string_value(json_object_get(profile, "fortune")),
                          "hp_picture",
                          json_string_value(json_object_get(profile, "picture")),
                          "hp_username",
                          username);
    res = h_insert(config->conn, j_query, NULL);
    json_decref(j_query);
    to_return = (res==H_OK?HU_OK:HU_ERROR_DB);
  } else {
    to_return = HU_ERROR;
  }
  json_decref(cur_profile);
  return to_return;
}

json_t * profile_get_history(struct config_elements * config, const char * username) {
  json_t * j_query, * j_result, * j_element;
  int res;
  char * hp_id_clause, * escaped;
  size_t index;

  escaped = h_escape_string(config->conn, username);
  hp_id_clause = msprintf("=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[sss]s{s{ssss}}ss}",
                      "table",
                      HUTCH_TABLE_PROFILE_HISTORY,
                      "columns",
                        config->conn->type==HOEL_DB_TYPE_MARIADB?"UNIX_TIMESTAMP(hph_date_access) AS date":"hph_date_access AS date",
                        "hph_ip_source AS ip_source",
                        "hph_access_type",
                      "where",
                        "hp_id",
                          "operator",
                          "raw",
                          "value",
                          hp_id_clause,
                      "order_by",
                      "hph_date_access DESC");
  free(escaped);
  free(hp_id_clause);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    json_array_foreach(j_result, index, j_element) {
      if (json_integer_value(json_object_get(j_element, "hph_access_type")) == access_read) {
        json_object_set_new(j_element, "access_type", json_string("read"));
      } else if (json_integer_value(json_object_get(j_element, "hph_access_type")) == access_update) {
        json_object_set_new(j_element, "access_type", json_string("update"));
      } else if (json_integer_value(json_object_get(j_element, "hph_access_type")) == access_history) {
        json_object_set_new(j_element, "access_type", json_string("history"));
      }
      json_object_del(j_element, "hph_access_type");
    }
    j_result= json_pack("{siso}", "result", HU_OK, "history", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "profile_get_history - Error executing j_query");
    j_result = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_result;
}
