/**
 *
 * Hutch - Password and private data locker
 * 
 * Declarations for constants and prototypes
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

#ifndef __HUTCH_H_
#define __HUTCH_H_

#define _HUTCH_VERSION_ "2.0.0"

/** Angharad libraries **/
#include <ulfius.h>
#include <yder.h>

#include <hoel.h>

#include "iddawc_resource.h"
#include "static_compressed_inmemory_website_callback.h"
#include "http_compression_callback.h"

#define HUTCH_LOG_NAME       "Hutch"
#define HUTCH_DEFAULT_PORT   4884
#define HUTCH_DEFAULT_PREFIX "api"

#define HUTCH_STOP     0
#define HUTCH_ERROR    1

#define HUTCH_CALLBACK_PRIORITY_ZERO           0
#define HUTCH_CALLBACK_PRIORITY_AUTHENTICATION 1
#define HUTCH_CALLBACK_PRIORITY_APPLICATION    2
#define HUTCH_CALLBACK_PRIORITY_FILE           3
#define HUTCH_CALLBACK_PRIORITY_POST_FILE      4
#define HUTCH_CALLBACK_PRIORITY_COMPRESSION    5

#define HU_OK                 0
#define HU_ERROR              1
#define HU_ERROR_UNAUTHORIZED 2
#define HU_ERROR_PARAM        3
#define HU_ERROR_DB           4
#define HU_ERROR_MEMORY       5
#define HU_ERROR_NOT_FOUND	  6

#define HUTCH_TABLE_PROFILE "h_profile"
#define HUTCH_TABLE_SAFE    "h_safe"
#define HUTCH_TABLE_KEY     "h_key"
#define HUTCH_TABLE_COIN    "h_coin"

#define SWITCH_DB_TYPE(T, M, S, P) \
        ((T)==HOEL_DB_TYPE_MARIADB?\
           (M):\
         (T)==HOEL_DB_TYPE_SQLITE?\
           (S):\
           (P)\
        )

#define EPOCH_MAX_LENGTH_STR 32
#define EPOCH_STR_FORMAT     EPOCH_MAX_LENGTH_STR+14

#define HUTCH_EXP_DEFAULT 600
#define HUTCH_CONTENT_TYPE_JWT "application/jwt"

/** Macro to avoid compiler warning when some parameters are unused and that's ok **/
#define UNUSED(x) (void)(x)

pthread_mutex_t global_handler_close_lock;
pthread_cond_t  global_handler_close_cond;

typedef enum {
  access_create,
  access_read,
  access_update,
  access_delete,
  access_history
} hutch_data_access;

struct config_elements {
  char                                         * config_file;
  unsigned int                                   port;
  char                                         * external_url;
  char                                         * api_prefix;
  unsigned long                                  log_mode;
  unsigned long                                  log_level;
  char                                         * log_file;
  char                                         * allow_origin;
  unsigned int                                   use_secure_connection;
  char                                         * secure_connection_key_file;
  char                                         * secure_connection_pem_file;
  char                                         * oidc_server_remote_config;
  unsigned int                                   oidc_server_remote_config_verify_cert;
  char                                         * oidc_server_public_jwks;
  char                                         * oidc_scope;
  char                                         * oidc_iss;
  char                                         * oidc_realm;
  char                                         * oidc_aud;
  time_t                                         oidc_dpop_max_iat;
  jwks_t                                       * sign_key;
  jwks_t                                       * public_key;
  time_t                                         sign_exp;
  struct _h_connection                         * conn;
  struct _u_instance                           * instance;
  struct _iddawc_resource_config               * iddawc_resource_config;
	struct _u_compressed_inmemory_website_config * static_file_config;
  char                                         * config_content;
  char                                         * jwks_content;
};

// Main functions and misc functions
int  build_config_from_args(int argc, char ** argv, struct config_elements * config);
int  build_config_from_file(struct config_elements * config);
int  check_config(struct config_elements * config);
void exit_handler(int handler);
void exit_server(struct config_elements ** config, int exit_value);
void print_help(FILE * output);
const char * get_filename_ext(const char *path);
char * get_file_content(const char * file_path);
char * url_decode(char *str);
char * url_encode(char *str);
const char * get_ip_source(const struct _u_request * request);

int check_result_value(json_t * result, const int value);

char * serialize_json_to_jwt(struct config_elements * config, const char * sign_kid, json_t * j_claims, const char * str_slaims);

json_t * profile_get(struct config_elements * config, const char * sub);
json_t * profile_is_valid(struct config_elements * config, json_t * j_profile);
int profile_set(struct config_elements * config, const char * sub, json_t * j_profile);
int profile_delete(struct config_elements * config, const char * sub);

json_t * safe_list(struct config_elements * config, json_t * j_profile);
json_t * safe_get(struct config_elements * config, json_t * j_profile, const char * name);
json_t * safe_is_valid(struct config_elements * config, json_t * j_profile, json_t * j_safe, int add);
int safe_add(struct config_elements * config, json_t * j_profile, json_t * j_safe);
int safe_set(struct config_elements * config, json_t * j_profile, const char * name, json_t * j_safe);
int safe_delete(struct config_elements * config, json_t * j_profile, const char * name);
json_int_t safe_get_id(struct config_elements * config, json_t * j_profile, const char * safe);

json_t * safe_key_list(struct config_elements * config, json_t * j_profile, const char * safe);
json_t * safe_key_get(struct config_elements * config, json_t * j_profile, const char * safe, const char * name);
json_t * safe_key_is_valid(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_safe_key, int add);
int safe_key_add(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_safe_key);
int safe_key_set(struct config_elements * config, json_t * j_profile, const char * safe, const char * name, json_t * j_safe_key);
int safe_key_delete(struct config_elements * config, json_t * j_profile, const char * safe, const char * name);

json_t * coin_list(struct config_elements * config, json_t * j_profile, const char * safe);
json_t * coin_get(struct config_elements * config, json_t * j_profile, const char * safe, const char * name);
json_t * coin_is_valid(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_coin, int add);
int coin_add(struct config_elements * config, json_t * j_profile, const char * safe, json_t * j_coin);
int coin_set(struct config_elements * config, json_t * j_profile, const char * safe, const char * name, json_t * j_coin);
int coin_delete(struct config_elements * config, json_t * j_profile, const char * safe, const char * name);

int callback_hutch_profile_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_profile_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_profile_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_safe_list (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_add (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_safe_key_list (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_key_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_key_add (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_key_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_key_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_coin_list (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_add (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_server_configuration (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_server_jwks (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_options (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_default (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_404_if_necessary (const struct _u_request * request, struct _u_response * response, void * user_data);

#endif
