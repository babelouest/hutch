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

#define _HUTCH_VERSION_ "1.1.2"

/** Angharad libraries **/
#include <ulfius.h>
#include <yder.h>

#include <hoel.h>

#include "glewlwyd_resource.h"
#include "static_file_callback.h"

#define HUTCH_LOG_NAME "Hutch"
#define HUTCH_DEFAULT_PORT 4884
#define HUTCH_DEFAULT_PREFIX "api"

#define HUTCH_RUNNING  0
#define HUTCH_STOP     1
#define HUTCH_ERROR    2

#define HUTCH_CALLBACK_PRIORITY_ZERO           0
#define HUTCH_CALLBACK_PRIORITY_AUTHENTICATION 1
#define HUTCH_CALLBACK_PRIORITY_APPLICATION    2
#define HUTCH_CALLBACK_PRIORITY_CLEAN          3

#define HU_OK                 0
#define HU_ERROR              1
#define HU_ERROR_UNAUTHORIZED 2
#define HU_ERROR_PARAM        3
#define HU_ERROR_DB           4
#define HU_ERROR_MEMORY       5
#define HU_ERROR_NOT_FOUND	  6

#define HUTCH_TABLE_PROFILE         "h_profile"
#define HUTCH_TABLE_SAFE            "h_safe"
#define HUTCH_TABLE_COIN            "h_coin"
#define HUTCH_TABLE_PROFILE_HISTORY "h_profile_history"
#define HUTCH_TABLE_SAFE_HISTORY    "h_safe_history"
#define HUTCH_TABLE_COIN_HISTORY    "h_coin_history"

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
  char *                             config_file;
  char *                             api_prefix;
  unsigned long                      log_mode;
  unsigned long                      log_level;
  char *                             log_file;
  char *                             allow_origin;
  unsigned int                       use_secure_connection;
  char *                             secure_connection_key_file;
  char *                             secure_connection_pem_file;
  struct _h_connection *             conn;
  struct _u_instance *               instance;
  struct _glewlwyd_resource_config * glewlwyd_resource_config;
	struct _static_file_config       * static_file_config;
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

json_t * profile_get(struct config_elements * config, const char * username);
json_t * is_profile_valid(json_t * profile);
int profile_set(struct config_elements * config, const char * username, json_t * profile);
int profile_add_access_history(struct config_elements * config, const char * username, const char * ip_address, hutch_data_access access);
json_t * profile_get_history(struct config_elements * config, const char * username);

json_t * safe_get_list(struct config_elements * config, const char * username);
json_t * safe_get(struct config_elements * config, const char * username, const char * safe_name);
json_t * is_safe_valid(struct config_elements * config, const char * username, json_t * safe, int add);
int safe_add(struct config_elements * config, const char * username, json_t * safe);
int safe_set(struct config_elements * config, const char * username, const char * safe_name, json_t * safe);
int safe_delete(struct config_elements * config, const char * username, const char * safe_name);
int safe_add_access_history(struct config_elements * config, const char * username, const char * safe_name, const char * ip_address, hutch_data_access access);
json_t * safe_get_history(struct config_elements * config, const char * username, const char * safe_name);

json_t * coin_get_list(struct config_elements * config, const char * username, const char * safe_name);
json_t * coin_get(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name);
json_t * is_coin_valid(struct config_elements * config, const char * username, const char * safe_name, json_t * coin, int add);
int coin_add(struct config_elements * config, const char * username, const char * safe_name, json_t * coin);
int coin_set(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name, json_t * coin);
int coin_delete(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name);
int coin_add_access_history(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name, const char * ip_address, hutch_data_access access);
json_t * coin_get_history(struct config_elements * config, const char * username, const char * safe_name, const char * coin_name);

int callback_hutch_profile_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_profile_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_profile_get_history (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_safe_get_list (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_get_history (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_add (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_safe_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_coin_get_list (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_get (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_get_history (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_add (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_set (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_coin_delete (const struct _u_request * request, struct _u_response * response, void * user_data);

int callback_hutch_server_configuration (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_options (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_hutch_static_file (const struct _u_request * request, struct _u_response * response, void * user_data);
int callback_clean (const struct _u_request * request, struct _u_response * response, void * user_data);

#endif
