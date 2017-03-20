/**
 *
 * Hutch - Password and private data locker
 *
 * Webservices management
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

#include <string.h>
#include "hutch.h"

/**
 * authorization cllback when there's no authorization required
 */
int callback_hutch_no_auth (const struct _u_request * request, struct _u_response * response, void * user_data) {
  return U_OK;
}

/**
 * default callback endpoint
 * return an error 404
 */
int callback_default (const struct _u_request * request, struct _u_response * response, void * user_data) {
  response->status = 404;
  response->json_body = json_pack("{ssss}", "error", "resource not found", "message", "no resource available at this address");
  return U_OK;
}

/**
 * static file callback endpoint
 */
int callback_hutch_static_file (const struct _u_request * request, struct _u_response * response, void * user_data) {
  void * buffer = NULL;
  size_t length, res;
  FILE * f;
  char * file_requested;
  char * file_path;
  const char * content_type;

  file_requested = request->http_url + strlen(((struct config_elements *)user_data)->static_files_prefix) + 1;
  
  if (file_requested == NULL || strlen(file_requested) == 0 || 0 == nstrcmp("/", file_requested)) {
    file_requested = "/index.html";
  }
  
  if (strchr(file_requested, '?') != NULL) {
    *strchr(file_requested, '?') = '\0';
  }
  
  file_path = msprintf("%s%s", ((struct config_elements *)user_data)->static_files_path, file_requested);

  if (access(file_path, F_OK) != -1) {
    f = fopen (file_path, "rb");
    if (f) {
      fseek (f, 0, SEEK_END);
      length = ftell (f);
      fseek (f, 0, SEEK_SET);
      buffer = malloc(length*sizeof(void));
      if (buffer) {
        res = fread (buffer, 1, length, f);
        if (res != length) {
          y_log_message(Y_LOG_LEVEL_WARNING, "callback_angharad_static_file - fread warning, reading %ld while expecting %ld", res, length);
        }
      }
      fclose (f);
    }

    if (buffer) {
      content_type = u_map_get_case(((struct config_elements *)user_data)->mime_types, get_filename_ext(file_requested));
      if (content_type == NULL) {
        content_type = u_map_get(((struct config_elements *)user_data)->mime_types, "*");
        y_log_message(Y_LOG_LEVEL_WARNING, "Static File Server - Unknown mime type for extension %s", get_filename_ext(file_requested));
      }
      response->binary_body = buffer;
      response->binary_body_length = length;
      u_map_put(response->map_header, "Content-Type", content_type);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "Static File Server - Internal error in %s", request->http_url);
      response->json_body = json_pack("{ss}", "error", request->http_url);
      response->status = 500;
    }
  } else {
    response->json_body = json_pack("{ss}", "resource not found", request->http_url);
    response->status = 404;
  }
  free(file_path);
  return U_OK;
}

/**
 * OPTIONS callback function
 * Send mandatory parameters for browsers to call REST APIs
 */
int callback_hutch_options (const struct _u_request * request, struct _u_response * response, void * user_data) {
  u_map_put(response->map_header, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  u_map_put(response->map_header, "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Bearer, Authorization");
  u_map_put(response->map_header, "Access-Control-Max-Age", "1800");
  return U_OK;
}

/**
 * root endpoint
 * redirects to static files address
 */
int callback_hutch_root (const struct _u_request * request, struct _u_response * response, void * user_data) {
  char * url = msprintf("%s/", ((struct config_elements *)user_data)->static_files_prefix);
  if (url != NULL) {
    response->status = 301;
    ulfius_add_header_to_response(response, "Location", url);
    free(url);
  } else {
    response->status = 500;
  }
  return U_OK;
};

/**
 * api description endpoint
 * send the location of prefixes
 */
int callback_hutch_server_configuration (const struct _u_request * request, struct _u_response * response, void * user_data) {
  response->json_body = json_pack("{ssssss}", 
                        "api_prefix", 
                        ((struct config_elements *)user_data)->url_prefix,
                        "app_prefix",
                        ((struct config_elements *)user_data)->static_files_prefix,
                        "hutch_scope",
                        ((struct config_elements *)user_data)->glewlwyd_resource_config->oauth_scope);
  return U_OK;
};

int callback_hutch_profile_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_profile;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_profile = profile_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")));
    if (check_result_value(j_profile, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_profile, "profile"));
      if (profile_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), ip_source, access_read) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error adding profile access history");
      }
    } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
      response->json_body = json_pack("{ss}", "error", "Profile not found, please create one");
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error getting profile");
    }
    json_decref(j_profile);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_profile_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_is_valid;
  int res;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_is_valid = is_profile_valid(request->json_body);
    if (j_is_valid != NULL && json_array_size(j_is_valid) == 0) {
      res = profile_set(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), request->json_body);
      if (profile_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), ip_source, access_update) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_set - Error adding profile access history");
      }
      if (res != HU_OK) {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_set - Error setting profile");
      }
    } else if (j_is_valid != NULL && json_array_size(j_is_valid) > 0) {
      response->status = 400;
      response->json_body= json_copy(j_is_valid);
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_set - Error is_profile_valid");
    }
    json_decref(j_is_valid);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_set - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_profile_get_history (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_history;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_history = profile_get_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")));
    if (check_result_value(j_history, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_history, "history"));
      if (profile_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), ip_source, access_history) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get_history - Error adding profile access history");
      }
    } else if (check_result_value(j_history, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get_history - Error getting profile history");
    }
    json_decref(j_history);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get_history - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_get_list (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_safe;
  
  if (check_result_value(j_token, G_OK)) {
    j_safe = safe_get_list(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")));
    if (check_result_value(j_safe, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_safe, "safe"));
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_list - Error getting safe");
    }
    json_decref(j_safe);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_list - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_safe;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_safe = safe_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else if (check_result_value(j_safe, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_safe, "safe"));
      if (safe_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), ip_source, access_read) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_list - Error adding safe access history");
      }
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_list - Error getting safe");
    }
    json_decref(j_safe);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_get_history (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_safe_history;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_safe_history = safe_get_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe_history, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_safe_history, "safe"));
      if (safe_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), ip_source, access_history) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_history - Error adding safe access history");
      }
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_history - Error getting safe");
    }
    json_decref(j_safe_history);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get_history - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_add (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_is_valid;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_is_valid = is_safe_valid(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), request->json_body, 1);
    if (j_is_valid != NULL && json_array_size(j_is_valid) == 0) {
      res = safe_add(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), request->json_body);
      if (safe_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), json_string_value(json_object_get(request->json_body, "name")), ip_source, access_create) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error adding safe access history");
      }
      if (res != HU_OK) {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error adding safe");
      }
    } else if (j_is_valid != NULL && json_array_size(j_is_valid) > 0) {
      response->status = 400;
      response->json_body= json_copy(j_is_valid);
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error is_safe_valid");
    }
    json_decref(j_is_valid);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_is_valid, * j_safe;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_safe = safe_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe, HU_OK)) {
      j_is_valid = is_safe_valid(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), request->json_body, 0);
      if (j_is_valid != NULL && json_array_size(j_is_valid) == 0) {
        res = safe_set(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), request->json_body);
        if (safe_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), ip_source, access_update) != HU_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error setting safe access history");
        }
        if (res != HU_OK) {
          response->status = 500;
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error setting safe");
        }
      } else if (j_is_valid != NULL && json_array_size(j_is_valid) > 0) {
        response->status = 400;
        response->json_body= json_copy(j_is_valid);
      } else {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error is_safe_valid");
      }
      json_decref(j_is_valid);
    } else if (check_result_value(j_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error getting safe");
      response->status = 500;
    }
    json_decref(j_safe);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_safe_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_safe;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_safe = safe_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe, HU_OK)) {
      if (safe_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), ip_source, access_update) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error setting safe access history");
      }
      res = safe_delete(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
      if (res != HU_OK) {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error deleting safe");
      }
    } else if (check_result_value(j_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error getting safe");
      response->status = 500;
    }
    json_decref(j_safe);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_get_list (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_coin;
  
  if (check_result_value(j_token, G_OK)) {
    j_coin = coin_get_list(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_coin, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_coin, "coin"));
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_list - Error getting coin");
    }
    json_decref(j_coin);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_list - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_coin;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_coin = coin_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_coin, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_coin, "coin"));
      if (coin_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), ip_source, access_read) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_list - Error adding coin access history");
      }
    } else if (check_result_value(j_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_list - Error getting coin");
    }
    json_decref(j_coin);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_get_history (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_coin_history;
  const char * ip_source = get_ip_source(request);
  
  if (check_result_value(j_token, G_OK)) {
    j_coin_history = coin_get_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_coin_history, HU_OK)) {
      response->json_body = json_copy(json_object_get(j_coin_history, "coin"));
      if (coin_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), ip_source, access_history) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_history - Error adding coin access history");
      }
    } else if (check_result_value(j_coin_history, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_history - Error getting coin");
    }
    json_decref(j_coin_history);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get_history - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_add (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_is_valid;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_is_valid = is_coin_valid(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), request->json_body, 1);
    if (j_is_valid != NULL && json_array_size(j_is_valid) == 0) {
      res = coin_add(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), request->json_body);
      if (coin_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), json_string_value(json_object_get(request->json_body, "name")), ip_source, access_create) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error adding coin access history");
      }
      if (res != HU_OK) {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error adding coin");
      }
    } else if (j_is_valid != NULL && json_array_size(j_is_valid) > 0) {
      response->status = 400;
      response->json_body= json_copy(j_is_valid);
    } else {
      response->status = 500;
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error is_coin_valid");
    }
    json_decref(j_is_valid);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_is_valid, * j_coin;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_coin = coin_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_coin, HU_OK)) {
      j_is_valid = is_coin_valid(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), request->json_body, 0);
      if (j_is_valid != NULL && json_array_size(j_is_valid) == 0) {
        if (coin_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), ip_source, access_update) != HU_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error setting coin access history");
        }
        res = coin_set(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), request->json_body);
        if (res != HU_OK) {
          response->status = 500;
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error setting coin");
        }
      } else if (j_is_valid != NULL && json_array_size(j_is_valid) > 0) {
        response->status = 400;
        response->json_body= json_copy(j_is_valid);
      } else {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error is_coin_valid");
      }
      json_decref(j_is_valid);
    } else if (check_result_value(j_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error getting coin");
      response->status = 500;
    }
    json_decref(j_coin);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}

int callback_hutch_coin_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_token = access_token_get_payload(u_map_get(request->map_header, HEADER_AUTHORIZATION) + strlen(HEADER_PREFIX_BEARER)), * j_coin;
  const char * ip_source = get_ip_source(request);
  int res;
  
  if (check_result_value(j_token, G_OK)) {
    j_coin = coin_get(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_coin, HU_OK)) {
      if (coin_add_access_history(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), ip_source, access_update) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error setting coin access history");
      }
      res = coin_delete(config, json_string_value(json_object_get(json_object_get(j_token, "grants"), "username")), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
      if (res != HU_OK) {
        response->status = 500;
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error deleting coin");
      }
    } else if (check_result_value(j_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error getting coin");
      response->status = 500;
    }
    json_decref(j_coin);
  } else {
    response->status = 500;
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error getting token payload");
  }
  json_decref(j_token);
  return U_OK;
}
