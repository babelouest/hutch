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

#include <string.h>
#include "hutch.h"

/**
 * OPTIONS callback function
 * Send mandatory parameters for browsers to call REST APIs
 */
int callback_hutch_options (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  UNUSED(user_data);
  u_map_put(response->map_header, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  u_map_put(response->map_header, "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Bearer, Authorization");
  u_map_put(response->map_header, "Access-Control-Max-Age", "1800");
  return U_CALLBACK_COMPLETE;
}

/**
 * api description endpoint
 * send the location of prefixes
 */
int callback_hutch_server_configuration (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                           U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, ULFIUS_HTTP_ENCODING_JSON,
                                           U_OPT_STRING_BODY, ((struct config_elements *)user_data)->config_content,
                                           U_OPT_NONE);
  return U_CALLBACK_CONTINUE;
};

/**
 * api description endpoint
 * send the location of prefixes
 */
int callback_hutch_server_jwks (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                           U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, ULFIUS_HTTP_ENCODING_JSON,
                                           U_OPT_STRING_BODY, ((struct config_elements *)user_data)->jwks_content,
                                           U_OPT_NONE);
  return U_CALLBACK_CONTINUE;
};

int callback_default (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  UNUSED(user_data);
  json_t * json_body = json_pack("{ssss}", "error", "resource not found", "message", "no resource available at this address");
  ulfius_set_json_body_response(response, 404, json_body);
  json_decref(json_body);
  return U_CALLBACK_CONTINUE;
}

int callback_404_if_necessary (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(user_data);
  if (!request->callback_position) {
    response->status = 404;
  }
  return U_CALLBACK_COMPLETE;
}

int callback_hutch_profile_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub")));
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    json_object_del(json_object_get(j_profile, "profile"), "hp_id");
    if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_profile, "profile"))) != NULL) {
      ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                               U_OPT_STRING_BODY, token,
                                               U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                               U_OPT_NONE);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error serialize_json_to_jwt");
      response->status = 500;
    }
    o_free(token);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 404;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_profile_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = ulfius_get_json_body_request(request, NULL), * j_result;
  
  j_result = profile_is_valid(config, j_profile);
  if (check_result_value(j_result, HU_OK)) {
    if (profile_set(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub")), j_profile) != HU_OK) {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error profile_set");
      response->status = 500;
    }
  } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
    ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                             U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                             U_OPT_NONE);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error profile_is_valid");
    response->status = 500;
  }
  json_decref(j_result);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_profile_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub")));
  
  if (check_result_value(j_profile, HU_OK)) {
    if (profile_delete(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))) != HU_OK) {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_delete - Error profile_delete");
      response->status = 500;
    }
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 200;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_profile_get - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_list (const struct _u_request * request, struct _u_response * response, void * user_data) {
  UNUSED(request);
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_safe = safe_list(config, json_object_get(j_profile, "profile"));
    if (check_result_value(j_safe, HU_OK)) {
      json_object_del(json_object_get(j_safe, "safe"), "hs_id");
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_safe, "safe"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_list - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_list - Error safe_list");
      response->status = 500;
    }
    json_decref(j_safe);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_list - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_safe = safe_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe, HU_OK)) {
      json_object_del(json_object_get(j_safe, "safe"), "hs_id");
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_safe, "safe"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else if (check_result_value(j_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get - Error safe_get");
      response->status = 500;
    }
    json_decref(j_safe);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_get - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_add (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe = ulfius_get_json_body_request(request, NULL),
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_result = safe_is_valid(config, json_object_get(j_profile, "profile"), j_safe, 1);
    if (check_result_value(j_result, HU_OK)) {
      if (safe_add(config, json_object_get(j_profile, "profile"), j_safe) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error safe_add");
        response->status = 500;
      }
    } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
      ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                               U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                               U_OPT_NONE);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error safe_is_valid");
      response->status = 500;
    }
    json_decref(j_result);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_add - Error profile_get");
    response->status = 500;
  }
  json_decref(j_safe);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe = ulfius_get_json_body_request(request, NULL),
         * j_cur_safe,
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_safe = safe_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_cur_safe, HU_OK)) {
      j_result = safe_is_valid(config, json_object_get(j_profile, "profile"), j_safe, 0);
      if (check_result_value(j_result, HU_OK)) {
        if (safe_set(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_safe) != HU_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error safe_set");
          response->status = 500;
        }
      } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                                 U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error safe_is_valid");
        response->status = 500;
      }
      json_decref(j_result);
    } else if (check_result_value(j_cur_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_safe);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_set - Error profile_get");
    response->status = 500;
  }
  json_decref(j_safe);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_cur_safe;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_safe = safe_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_cur_safe, HU_OK)) {
      if (safe_delete(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe")) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error safe_delete");
        response->status = 500;
      }
    } else if (check_result_value(j_cur_safe, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_safe);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_delete - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_key_list (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe_key;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_safe_key = safe_key_list(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_safe_key, HU_OK)) {
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_safe_key, "key"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_list - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_list - Error safe_key_list");
      response->status = 500;
    }
    json_decref(j_safe_key);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_list - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_key_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe_key;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_safe_key = safe_key_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "key"));
    if (check_result_value(j_safe_key, HU_OK)) {
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_safe_key, "key"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_get - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else if (check_result_value(j_safe_key, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_get - Error safe_key_get");
      response->status = 500;
    }
    json_decref(j_safe_key);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_get - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_key_add (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe_key = ulfius_get_json_body_request(request, NULL),
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_result = safe_key_is_valid(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_safe_key, 1);
    if (check_result_value(j_result, HU_OK)) {
      if (safe_key_add(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_safe_key) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_add - Error safe_key_add");
        response->status = 500;
      }
    } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
      ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                               U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                               U_OPT_NONE);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_add - Error safe_key_is_valid");
      response->status = 500;
    }
    json_decref(j_result);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_add - Error profile_get");
    response->status = 500;
  }
  json_decref(j_safe_key);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_key_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_safe_key = ulfius_get_json_body_request(request, NULL),
         * j_cur_safe_key,
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_safe_key = safe_key_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "key"));
    if (check_result_value(j_cur_safe_key, HU_OK)) {
      j_result = safe_key_is_valid(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_safe_key, 0);
      if (check_result_value(j_result, HU_OK)) {
        if (safe_key_set(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "key"), j_safe_key) != HU_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_set - Error safe_set");
          response->status = 500;
        }
      } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                                 U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_set - Error safe_is_valid");
        response->status = 500;
      }
      json_decref(j_result);
    } else if (check_result_value(j_cur_safe_key, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_set - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_safe_key);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_set - Error profile_get");
    response->status = 500;
  }
  json_decref(j_safe_key);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_safe_key_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_cur_safe_key;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_safe_key = safe_key_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "key"));
    if (check_result_value(j_cur_safe_key, HU_OK)) {
      if (safe_key_delete(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "key")) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_delete - Error safe_key_delete");
        response->status = 500;
      }
    } else if (check_result_value(j_cur_safe_key, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_delete - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_safe_key);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_safe_key_delete - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_coin_list (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_coin;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_coin = coin_list(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"));
    if (check_result_value(j_coin, HU_OK)) {
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_coin, "coin"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_list - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_list - Error coin_list");
      response->status = 500;
    }
    json_decref(j_coin);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_list - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_coin_get (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_coin;
  char * token;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_coin = coin_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_coin, HU_OK)) {
      if ((token = serialize_json_to_jwt(config, json_string_value(json_object_get(json_object_get(j_profile, "profile"), "sign_kid")), json_object_get(j_coin, "coin"))) != NULL) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 200,
                                                 U_OPT_STRING_BODY, token,
                                                 U_OPT_HEADER_PARAMETER, ULFIUS_HTTP_HEADER_CONTENT, "application/jwt",
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get - Error serialize_json_to_jwt");
        response->status = 500;
      }
      o_free(token);
    } else if (check_result_value(j_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get - Error coin_get");
      response->status = 500;
    }
    json_decref(j_coin);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_get - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_coin_add (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_coin = ulfius_get_json_body_request(request, NULL),
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_result = coin_is_valid(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_coin, 1);
    if (check_result_value(j_result, HU_OK)) {
      if (coin_add(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_coin) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error coin_add");
        response->status = 500;
      }
    } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
      ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                               U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                               U_OPT_NONE);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error coin_is_valid");
      response->status = 500;
    }
    json_decref(j_result);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_add - Error profile_get");
    response->status = 500;
  }
  json_decref(j_coin);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_coin_set (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_coin = ulfius_get_json_body_request(request, NULL),
         * j_cur_coin,
         * j_result;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_coin = coin_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_cur_coin, HU_OK)) {
      j_result = coin_is_valid(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), j_coin, 0);
      if (check_result_value(j_result, HU_OK)) {
        if (coin_set(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"), j_coin) != HU_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error safe_set");
          response->status = 500;
        }
      } else if (check_result_value(j_result, HU_ERROR_PARAM)) {
        ulfius_set_response_properties(response, U_OPT_STATUS, 400,
                                                 U_OPT_JSON_BODY, json_object_get(j_result, "error"),
                                                 U_OPT_NONE);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error safe_is_valid");
        response->status = 500;
      }
      json_decref(j_result);
    } else if (check_result_value(j_cur_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_coin);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_set - Error profile_get");
    response->status = 500;
  }
  json_decref(j_coin);
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}

int callback_hutch_coin_delete (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_profile = profile_get(config, json_string_value(json_object_get((json_t*)response->shared_data, "sub"))),
         * j_cur_coin;
  
  if (check_result_value(j_profile, HU_OK)) {
    j_cur_coin = coin_get(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin"));
    if (check_result_value(j_cur_coin, HU_OK)) {
      if (coin_delete(config, json_object_get(j_profile, "profile"), u_map_get(request->map_url, "safe"), u_map_get(request->map_url, "coin")) != HU_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error coin_delete");
        response->status = 500;
      }
    } else if (check_result_value(j_cur_coin, HU_ERROR_NOT_FOUND)) {
      response->status = 404;
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error safe_get");
      response->status = 500;
    }
    json_decref(j_cur_coin);
  } else if (check_result_value(j_profile, HU_ERROR_NOT_FOUND)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "callback_hutch_coin_delete - Error profile_get");
    response->status = 500;
  }
  json_decref(j_profile);
  return U_CALLBACK_CONTINUE;
}
