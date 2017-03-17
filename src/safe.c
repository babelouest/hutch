/**
 *
 * Hutch - Password and private data locker
 *
 * Safe management
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

json_t * safe_get_list(struct config_elements * config, const char * username) {
  json_t * j_query, * j_result, * j_return = NULL;
  int res;
  char * escaped, * clause_profile;
  
  escaped = h_escape_string(config->conn, username);
  clause_profile = msprintf("= (SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[sss]s{sis{ssss}}}",
                      "table",
                      HUTCH_TABLE_SAFE,
                      "columns",
                        "hs_name AS name",
                        "hs_description AS description",
                        "hs_key AS `key`",
                      "where",
                        "hs_deleted",
                        0,
                        "hp_id",
                          "operator",
                          "raw",
                          "value",
                          clause_profile);
  free(escaped);
  free(clause_profile);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    j_return = json_pack("{siso}", "result", HU_OK, "safe", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_get_list - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * safe_get(struct config_elements * config, const char * username, const char * safe_name) {
  json_t * j_query, * j_result, * j_return = NULL;
  int res;
  char * escaped, * clause_profile;
  
  escaped = h_escape_string(config->conn, username);
  clause_profile = msprintf("= (SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[sss]s{sis{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_SAFE,
                      "columns",
                        "hs_name AS name",
                        "hs_description AS description",
                        "hs_key AS `key`",
                      "where",
                        "hs_deleted",
                        0,
                        "hp_id",
                          "operator",
                          "raw",
                          "value",
                          clause_profile,
                        "hs_name",
                        safe_name);
  free(escaped);
  free(clause_profile);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  if (res == H_OK) {
    if (json_array_size(j_result) > 0) {
      j_return = json_pack("{siso}", "result", HU_OK, "safe", json_copy(json_array_get(j_result, 0)));
    } else {
      j_return = json_pack("{si}", "result", HU_ERROR_NOT_FOUND);
    }
    json_decref(j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_get - Error executing j_query");
    j_return = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_return;
}

json_t * is_safe_valid(struct config_elements * config, const char * username, json_t * safe, int add) {
  json_t * j_return = json_array(), * j_safe;
  
  if (j_return != NULL) {
    if (safe == NULL || !json_is_object(safe)) {
      json_array_append_new(j_return, json_pack("{ss}", "safe", "safe must be a json object"));
    } else {
      if (add) {
        if (json_object_get(safe, "name") == NULL || !json_is_string(json_object_get(safe, "name")) || json_string_length(json_object_get(safe, "name")) == 0 || json_string_length(json_object_get(safe, "name")) > 128) {
          json_array_append_new(j_return, json_pack("{ss}", "name", "name is mandatory and must be a non empty string of maximum 128 characters"));
        } else {
          j_safe = safe_get(config, username, json_string_value(json_object_get(safe, "name")));
          if (check_result_value(j_safe, HU_OK)) {
            json_array_append_new(j_return, json_pack("{ss}", "name", "name is already taken for the current user"));
          }
          json_decref(j_safe);
        }
      }
      
      if (json_object_get(safe, "description") != NULL && (!json_is_string(json_object_get(safe, "description"))  || json_string_length(json_object_get(safe, "description")) > 512)) {
        json_array_append_new(j_return, json_pack("{ss}", "description", "description must be a string of maximum 512 characters"));
      }
      
      if (json_object_get(safe, "key") == NULL || !json_is_string(json_object_get(safe, "key")) || json_string_length(json_object_get(safe, "key")) == 0 || json_string_length(json_object_get(safe, "key")) > 512) {
        json_array_append_new(j_return, json_pack("{ss}", "key", "key is mandatory and must be a non empty string of maximum 512 characters"));
      }
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "is_safe_valid - Error allocating resources for j_return");
  }
  return j_return;
}

int safe_add(struct config_elements * config, const char * username, json_t * safe) {
  json_t * j_query;
  int res;
  char * escaped, * clause_profile;

  escaped = h_escape_string(config->conn, username);
  clause_profile = msprintf("(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  j_query = json_pack("{sss{sssssss{ss}}}",
                      "table",
                      HUTCH_TABLE_SAFE,
                      "values",
                        "hs_name",
                        json_string_value(json_object_get(safe, "name")),
                        "hs_description",
                        json_object_get(safe, "description")!=NULL?json_string_value(json_object_get(safe, "description")):"",
                        "hs_key",
                        json_string_value(json_object_get(safe, "key")),
                        "hp_id",
                          "raw",
                          clause_profile);
  free(escaped);
  free(clause_profile);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_add - Error executing j_query");
    return HU_ERROR_DB;
  } else {
    return HU_OK;
  }
}

int safe_set(struct config_elements * config, const char * username, const char * safe_name, json_t * safe) {
  json_t * j_query;
  int res;
  char * escaped, * clause_profile;

  escaped = h_escape_string(config->conn, username);
  clause_profile = msprintf("= (SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  j_query = json_pack("{sss{ssss}s{s{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_SAFE,
                      "set",
                        "hs_description",
                        json_object_get(safe, "description")!=NULL?json_string_value(json_object_get(safe, "description")):"",
                        "hs_key",
                        json_string_value(json_object_get(safe, "key")),
                      "where",
                        "hp_id",
                          "operator",
                          "raw",
                          "value",
                          clause_profile,
                        "hs_name",
                        safe_name);
  free(escaped);
  free(clause_profile);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_set - Error executing j_query");
    return HU_ERROR_DB;
  } else {
    return HU_OK;
  }
}

int safe_delete(struct config_elements * config, const char * username, const char * safe_name) {
  json_t * j_query;
  int res;
  char * escaped, * clause_profile;

  escaped = h_escape_string(config->conn, username);
  clause_profile = msprintf("= (SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s')", HUTCH_TABLE_PROFILE, escaped);
  j_query = json_pack("{sss{si}s{s{ssss}ss}}",
                      "table",
                      HUTCH_TABLE_SAFE,
                      "set",
                        "hs_deleted",
                        1,
                      "where",
                        "hp_id",
                          "operator",
                          "raw",
                          "value",
                          clause_profile,
                        "hs_name",
                        safe_name);
  free(escaped);
  free(clause_profile);
  res = h_update(config->conn, j_query, NULL);
  json_decref(j_query);
  if (res != H_OK) {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_delete - Error executing j_query");
    return HU_ERROR_DB;
  } else {
    return HU_OK;
  }
}

int safe_add_access_history(struct config_elements * config, const char * username, const char * safe_name, const char * ip_address, hutch_data_access access) {
  json_t * j_query;
  int res;
  char * hp_id_clause, * escaped, * escaped_name;
  
  escaped_name = h_escape_string(config->conn, safe_name);
  escaped = h_escape_string(config->conn, username);
  hp_id_clause = msprintf("(SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, escaped_name, HUTCH_TABLE_PROFILE, escaped);
  j_query = json_pack("{sss{sssis{ss}}}",
                      "table",
                      HUTCH_TABLE_SAFE_HISTORY,
                      "values",
                        "hsh_ip_source",
                        ip_address,
                        "hsh_access_type",
                        access,
                        "hs_id",
                          "raw",
                          hp_id_clause);
  free(escaped);
  free(escaped_name);
  free(hp_id_clause);
  res = h_insert(config->conn, j_query, NULL);
  json_decref(j_query);
  return (res==H_OK?HU_OK:HU_ERROR_DB);
}

json_t * safe_get_history(struct config_elements * config, const char * username, const char * safe_name) {
  json_t * j_query, * j_result, * j_element;
  int res;
  char * hp_id_clause, * escaped, * escaped_name;
  size_t index;

  escaped_name = h_escape_string(config->conn, safe_name);
  escaped = h_escape_string(config->conn, username);
  hp_id_clause = msprintf("= (SELECT `hs_id` FROM `%s` WHERE `hs_name`='%s' AND `hs_deleted`=0 AND `hp_id`=(SELECT `hp_id` FROM `%s` WHERE `hp_username`='%s'))", HUTCH_TABLE_SAFE, escaped_name, HUTCH_TABLE_PROFILE, escaped);
  
  j_query = json_pack("{sss[sss]s{s{ssss}}}",
                      "table",
                      HUTCH_TABLE_SAFE_HISTORY,
                      "columns",
                        config->conn->type==HOEL_DB_TYPE_MARIADB?"UNIX_TIMESTAMP(hsh_date_access) AS date":"hsh_date_access AS date",
                        "hsh_ip_source AS ip_source",
                        "hsh_access_type",
                      "where",
                        "hs_id",
                          "operator",
                          "raw",
                          "value",
                          hp_id_clause);
  free(escaped);
  free(escaped_name);
  free(hp_id_clause);
  res = h_select(config->conn, j_query, &j_result, NULL);
  json_decref(j_query);
  
  if (res == H_OK) {
    json_array_foreach(j_result, index, j_element) {
      if (json_integer_value(json_object_get(j_element, "hsh_access_type")) == access_read) {
        json_object_set_new(j_element, "access_type", json_string("read"));
      } else if (json_integer_value(json_object_get(j_element, "hsh_access_type")) == access_update) {
        json_object_set_new(j_element, "access_type", json_string("update"));
      } else if (json_integer_value(json_object_get(j_element, "hsh_access_type")) == access_history) {
        json_object_set_new(j_element, "access_type", json_string("history"));
      }
      json_object_del(j_element, "hsh_access_type");
    }
    j_result= json_pack("{siso}", "result", HU_OK, "history", j_result);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "safe_get_history - Error executing j_query");
    j_result = json_pack("{si}", "result", HU_ERROR_DB);
  }
  return j_result;
}
