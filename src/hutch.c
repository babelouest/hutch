/**
 *
 * Hutch - Password and private data locker
 * 
 * Declarations for constants and prototypes
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

#include <getopt.h>
#include <signal.h>
#include <ctype.h>
#include <libconfig.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <string.h>

#include "hutch.h"

pthread_mutex_t global_handler_close_lock;
pthread_cond_t  global_handler_close_cond;

/**
 *
 * Main function
 * 
 * Initialize config structure, parse the arguments and the config file
 * Then run the webservice
 *
 */
int main (int argc, char ** argv) {
  struct config_elements * config = malloc(sizeof(struct config_elements));
  int res;
  char * str_jwks;
  json_t * j_jwks, * j_tmp;
  size_t i;
  jwk_t * jwk, * jwk_pub;
  
  srand(time(NULL));
  if (config == NULL) {
    fprintf(stderr, "Memory error - config\n");
    return 1;
  }
  
  // Init config structure with default values
  config->config_file = NULL;
  config->port = HUTCH_DEFAULT_PORT;
  config->external_url = NULL;
  config->api_prefix = o_strdup(HUTCH_DEFAULT_PREFIX);
  config->log_mode = Y_LOG_MODE_NONE;
  config->log_level = Y_LOG_LEVEL_NONE;
  config->log_file = NULL;
  config->conn = NULL;
  config->instance = malloc(sizeof(struct _u_instance));
  config->allow_origin = NULL;
  config->iddawc_resource_config = malloc(sizeof(struct _iddawc_resource_config));
  config->static_file_config = o_malloc(sizeof(struct _u_compressed_inmemory_website_config));
  config->use_secure_connection = 0;
  config->secure_connection_key_file = NULL;
  config->secure_connection_pem_file = NULL;
  config->oidc_server_remote_config = NULL;
  config->oidc_server_remote_config_verify_cert = 1;
  config->oidc_server_public_jwks = NULL;
  config->oidc_scope = NULL;
  config->oidc_iss = NULL;
  config->oidc_realm = NULL;
  config->oidc_aud = NULL;
  config->oidc_dpop_max_iat = 0;
  config->config_content = NULL;
  config->sign_exp = HUTCH_EXP_DEFAULT;
  config->jwks_content = NULL;
  if (config->instance == NULL || config->iddawc_resource_config == NULL || config->static_file_config == NULL) {
    fprintf(stderr, "Memory error - config->instance || config->iddawc_resource_config || config->static_file_config\n");
    o_free(config);
    return 1;
  }
  if (r_jwks_init(&config->sign_key) != RHN_OK) {
    fprintf(stderr, "Memory error - config->sign_key\n");
    o_free(config->instance);
    o_free(config->iddawc_resource_config);
    o_free(config->static_file_config);
    o_free(config);
    return 1;
  }
  if (r_jwks_init(&config->public_key) != RHN_OK) {
    fprintf(stderr, "Memory error - config->public_key\n");
    r_jwks_free(config->sign_key);
    o_free(config->instance);
    o_free(config->iddawc_resource_config);
    o_free(config->static_file_config);
    o_free(config);
    return 1;
  }

  if (pthread_mutex_init(&global_handler_close_lock, NULL) || 
      pthread_cond_init(&global_handler_close_cond, NULL)) {
    y_log_message(Y_LOG_LEVEL_ERROR, "init - Error initializing global_handler_close_lock or global_handler_close_cond");
  }
  // Catch end signals to make a clean exit
  signal (SIGQUIT, exit_handler);
  signal (SIGINT, exit_handler);
  signal (SIGTERM, exit_handler);
  signal (SIGHUP, exit_handler);

  if (u_init_compressed_inmemory_website_config(config->static_file_config) != U_OK) {
    fprintf(stderr, "Error u_init_compressed_inmemory_website_config\n");
    exit_server(&config, HUTCH_ERROR);
  }
  u_map_put(&config->static_file_config->mime_types, "*", "application/octet-stream");

  // First we parse command line arguments
  if (!build_config_from_args(argc, argv, config)) {
    fprintf(stderr, "Error reading command-line parameters\n");
    print_help(stderr);
    exit_server(&config, HUTCH_ERROR);
  }
  
  // Then we parse configuration file
  // They have lower priority than command line parameters
  if (!build_config_from_file(config)) {
    fprintf(stderr, "Error config file\n");
    exit_server(&config, HUTCH_ERROR);
  }
  
  // Check if all mandatory configuration variables are present and correctly typed
  if (!check_config(config)) {
    fprintf(stderr, "Error initializing configuration\n");
    exit_server(&config, HUTCH_ERROR);
  }

  i_global_init();
  
  if (!y_init_logs(HUTCH_LOG_NAME, config->log_mode, config->log_level, config->log_file, "Starting Hutch Server")) {
    fprintf(stderr, "Error initializing logs\n");
    exit_server(&config, HUTCH_ERROR);
  }
  
  for (i=0; i<r_jwks_size(config->sign_key); i++) {
    jwk = r_jwks_get_at(config->sign_key, i);
    r_jwk_init(&jwk_pub);
    r_jwk_extract_pubkey(jwk, jwk_pub, 0);
    r_jwks_append_jwk(config->public_key, jwk_pub);
    r_jwk_free(jwk_pub);
    r_jwk_free(jwk);
  }
  
  if (i_jwt_profile_access_token_init_config(config->iddawc_resource_config, I_METHOD_HEADER, NULL, NULL, config->oidc_scope, NULL, 1, 1, config->oidc_dpop_max_iat) == I_TOKEN_OK) {
    if (config->oidc_server_remote_config != NULL) {
      if (!i_jwt_profile_access_token_load_config(config->iddawc_resource_config, config->oidc_server_remote_config, config->oidc_server_remote_config_verify_cert)) {
        y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error i_jwt_profile_access_token_load_config");
        exit_server(&config, HUTCH_ERROR);
      }
      y_log_message(Y_LOG_LEVEL_INFO, "OIDC authentication - Load remote authentification config: %s", config->oidc_server_remote_config);
    } else if (config->oidc_server_public_jwks != NULL) {
      res = 1;
      if ((str_jwks = get_file_content(config->oidc_server_public_jwks)) != NULL) {
        if ((j_jwks = json_loads(str_jwks, JSON_DECODE_ANY, NULL)) != NULL) {
          if (!i_jwt_profile_access_token_load_jwks(config->iddawc_resource_config, j_jwks, config->oidc_iss)) {
            y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error i_jwt_profile_access_token_load_jwks");
          }
        } else {
          y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error parsing jwks");
          res = 0;
        }
        json_decref(j_jwks);
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error reading jwks file");
        res = 0;
      }
      o_free(str_jwks);
      if (!res) {
        exit_server(&config, HUTCH_ERROR);
      }
      y_log_message(Y_LOG_LEVEL_INFO, "OIDC authentication - Load signature key from file: %s", config->oidc_server_public_jwks);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error oidc config");
      exit_server(&config, HUTCH_ERROR);
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "OIDC authentication - Error i_jwt_profile_access_token_init_config");
    exit_server(&config, HUTCH_ERROR);
  }

  j_tmp = json_pack("{ss++ ss++ ss ss* ss+}", 
                    "profile_endpoint", config->external_url, config->api_prefix, "/profile",
                    "safe_endpoint", config->external_url, config->api_prefix, "/safe",
                    "scope", config->iddawc_resource_config->oauth_scope,
                    "oidc_server_remote_config", config->oidc_server_remote_config,
                    "jwks_uri", config->external_url, "jwks");
  if ((config->config_content = json_dumps(j_tmp, JSON_COMPACT)) == NULL) {
    fprintf(stderr, "Error setting config content\n");
    exit_server(&config, HUTCH_ERROR);
  }
  json_decref(j_tmp);
  
  if ((config->jwks_content = r_jwks_export_to_json_str(config->public_key, 0)) == NULL) {
    fprintf(stderr, "Error setting jwks content\n");
    exit_server(&config, HUTCH_ERROR);
  }
  
  ulfius_init_instance(config->instance, config->port, NULL, NULL);
  
  // At this point, we declare all API endpoints and configure 
  
  // Profile endpoint
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/profile/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_profile_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/profile/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_profile_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/profile/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_profile_delete, (void*)config);
  
  // Safe endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_list, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "POST", config->api_prefix, "/safe/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_add, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/safe/:safe", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/safe/:safe", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_delete, (void*)config);

  // Safe key endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/key/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_key_list, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/key/:key", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_key_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "POST", config->api_prefix, "/safe/:safe/key/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_key_add, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/safe/:safe/key/:key", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_key_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/safe/:safe/key/:key", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_safe_key_delete, (void*)config);
  
  // Coin endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/coin/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_coin_list, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/coin/:coin", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_coin_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "POST", config->api_prefix, "/safe/:safe/coin/", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_coin_add, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/safe/:safe/coin/:coin", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_coin_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/safe/:safe/coin/:coin", HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_coin_delete, (void*)config);
  
  // Other endpoints
  ulfius_add_endpoint_by_val(config->instance, "*", config->api_prefix, "*", HUTCH_CALLBACK_PRIORITY_AUTHENTICATION, &callback_check_jwt_profile_access_token, config->iddawc_resource_config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->static_file_config->url_prefix, "*", HUTCH_CALLBACK_PRIORITY_FILE, &callback_static_compressed_inmemory_website, (void*)config->static_file_config);
  ulfius_add_endpoint_by_val(config->instance, "GET", "/.well-known/hutch-configuration", NULL, HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_server_configuration, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", "/jwks/", NULL, HUTCH_CALLBACK_PRIORITY_APPLICATION, &callback_hutch_server_jwks, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "OPTIONS", NULL, "*", HUTCH_CALLBACK_PRIORITY_ZERO, &callback_hutch_options, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "*", config->api_prefix, "*", HUTCH_CALLBACK_PRIORITY_COMPRESSION, &callback_http_compression, NULL);
  ulfius_add_endpoint_by_val(config->instance, "GET", NULL, "*", HUTCH_CALLBACK_PRIORITY_POST_FILE, &callback_404_if_necessary, NULL);
  ulfius_set_default_endpoint(config->instance, &callback_default, (void*)config);

  // Set default headers
  u_map_put(config->instance->default_headers, "Access-Control-Allow-Origin", config->allow_origin);
  u_map_put(config->instance->default_headers, "Access-Control-Allow-Credentials", "true");
  u_map_put(config->instance->default_headers, "Cache-Control", "no-store");
  u_map_put(config->instance->default_headers, "Pragma", "no-cache");

  y_log_message(Y_LOG_LEVEL_INFO, "Start hutch on port %d, prefix: %s, secure: %s, scope %s, external url: %s", config->instance->port, config->api_prefix, config->use_secure_connection?"true":"false", config->iddawc_resource_config->oauth_scope, config->external_url);
  
  if (config->use_secure_connection) {
    char * key_file = get_file_content(config->secure_connection_key_file);
    char * pem_file = get_file_content(config->secure_connection_pem_file);
    if (key_file != NULL && pem_file != NULL) {
      res = ulfius_start_secure_framework(config->instance, key_file, pem_file);
    } else {
      res = U_ERROR_PARAMS;
    }
    free(key_file);
    free(pem_file);
  } else {
    res = ulfius_start_framework(config->instance);
  }
  if (res == U_OK) {
    // Wait until stop signal is broadcasted
    pthread_mutex_lock(&global_handler_close_lock);
    pthread_cond_wait(&global_handler_close_cond, &global_handler_close_lock);
    pthread_mutex_unlock(&global_handler_close_lock);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error starting hutch webservice");
    exit_server(&config, HUTCH_ERROR);
  }
  if (pthread_mutex_destroy(&global_handler_close_lock) ||
      pthread_cond_destroy(&global_handler_close_cond)) {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error destroying global_handler_close_lock or global_handler_close_cond");
  }
  exit_server(&config, HUTCH_STOP);
  return 0;
}

/**
 * Exit properly the server by closing opened connections, databases and files
 */
void exit_server(struct config_elements ** config, int exit_value) {
  
  if (config != NULL && *config != NULL) {
    // Cleaning data
    free((*config)->config_file);
    free((*config)->api_prefix);
    free((*config)->external_url);
    free((*config)->log_file);
    free((*config)->allow_origin);
    free((*config)->secure_connection_key_file);
    free((*config)->secure_connection_pem_file);
    i_jwt_profile_access_token_close_config((*config)->iddawc_resource_config);
    o_free((*config)->oidc_server_remote_config);
    o_free((*config)->oidc_server_public_jwks);
    o_free((*config)->oidc_scope);
    o_free((*config)->oidc_iss);
    o_free((*config)->oidc_realm);
    o_free((*config)->oidc_aud);
    o_free((*config)->iddawc_resource_config);
    
    o_free((*config)->static_file_config->files_path);
    o_free((*config)->static_file_config->url_prefix);
    u_clean_compressed_inmemory_website_config((*config)->static_file_config);
    o_free((*config)->static_file_config);
    o_free((*config)->config_content);
    o_free((*config)->jwks_content);
    r_jwks_free((*config)->sign_key);
    r_jwks_free((*config)->public_key);
    h_close_db((*config)->conn);
    h_clean_connection((*config)->conn);
    ulfius_stop_framework((*config)->instance);
    ulfius_clean_instance((*config)->instance);
    free((*config)->instance);
    
    free(*config);
    (*config) = NULL;
  }
  y_close_logs();
  i_global_close();
  exit(exit_value);
}

/**
 * Initialize the application configuration based on the command line parameters
 */
int build_config_from_args(int argc, char ** argv, struct config_elements * config) {
  int next_option;
  const char * short_options = "c::p::u::m::l::f::h::v::";
  char * tmp = NULL, * to_free = NULL, * one_log_mode = NULL;
  static const struct option long_options[]= {
    {"config-file", optional_argument, NULL, 'c'},
    {"port", optional_argument, NULL, 'p'},
    {"url-prefix", optional_argument, NULL, 'u'},
    {"log-mode", optional_argument, NULL, 'm'},
    {"log-level", optional_argument, NULL, 'l'},
    {"log-file", optional_argument, NULL, 'f'},
    {"help", optional_argument, NULL, 'h'},
    {"version", optional_argument, NULL, 'v'},
    {NULL, 0, NULL, 0}
  };
  
  if (config != NULL) {
    do {
      next_option = getopt_long(argc, argv, short_options, long_options, NULL);
      
      switch (next_option) {
        case 'c':
          if (optarg != NULL) {
            if ((config->config_file = o_strdup(optarg)) == NULL) {
              fprintf(stderr, "Error allocating config->config_file, exiting\n");
              exit_server(&config, HUTCH_STOP);
            }
          } else {
            fprintf(stderr, "Error!\nNo config file specified\n");
            return 0;
          }
          break;
        case 'p':
          if (optarg != NULL) {
            config->port = strtol(optarg, NULL, 10);
          } else {
            fprintf(stderr, "Error!\nNo TCP Port number specified\n");
            return 0;
          }
          break;
        case 'u':
          if (optarg != NULL) {
            o_free(config->api_prefix);
            if ((config->api_prefix = o_strdup(optarg)) == NULL) {
              fprintf(stderr, "Error allocating config->api_prefix, exiting\n");
              exit_server(&config, HUTCH_STOP);
            }
          } else {
            fprintf(stderr, "Error!\nNo URL prefix specified\n");
            return 0;
          }
          break;
        case 'm':
          if (optarg != NULL) {
            if ((tmp = o_strdup(optarg)) == NULL) {
              fprintf(stderr, "Error allocating log_mode, exiting\n");
              exit_server(&config, HUTCH_STOP);
            }
            one_log_mode = strtok(tmp, ",");
            while (one_log_mode != NULL) {
              if (0 == strncmp("console", one_log_mode, strlen("console"))) {
                config->log_mode |= Y_LOG_MODE_CONSOLE;
              } else if (0 == strncmp("syslog", one_log_mode, strlen("syslog"))) {
                config->log_mode |= Y_LOG_MODE_SYSLOG;
              } else if (0 == strncmp("file", one_log_mode, strlen("file"))) {
                config->log_mode |= Y_LOG_MODE_FILE;
              }
              one_log_mode = strtok(NULL, ",");
            }
            free(to_free);
          } else {
            fprintf(stderr, "Error!\nNo mode specified\n");
            return 0;
          }
          break;
        case 'l':
          if (optarg != NULL) {
            if (0 == strncmp("NONE", optarg, strlen("NONE"))) {
              config->log_level = Y_LOG_LEVEL_NONE;
            } else if (0 == strncmp("ERROR", optarg, strlen("ERROR"))) {
              config->log_level = Y_LOG_LEVEL_ERROR;
            } else if (0 == strncmp("WARNING", optarg, strlen("WARNING"))) {
              config->log_level = Y_LOG_LEVEL_WARNING;
            } else if (0 == strncmp("INFO", optarg, strlen("INFO"))) {
              config->log_level = Y_LOG_LEVEL_INFO;
            } else if (0 == strncmp("DEBUG", optarg, strlen("DEBUG"))) {
              config->log_level = Y_LOG_LEVEL_DEBUG;
            }
          } else {
            fprintf(stderr, "Error!\nNo log level specified\n");
            return 0;
          }
          break;
        case 'f':
          if (optarg != NULL) {
            o_free(config->log_file);
            if ((config->log_file = o_strdup(optarg)) == NULL) {
              fprintf(stderr, "Error allocating config->log_file, exiting\n");
              exit_server(&config, HUTCH_STOP);
            }
          } else {
            fprintf(stderr, "Error!\nNo log file specified\n");
            return 0;
          }
          break;
        case 'h':
        case 'v':
				  print_help(stdout);
          exit_server(&config, HUTCH_STOP);
          break;
      }
      
    } while (next_option != -1);
    
    // If none exists, exit failure
    if (config->config_file == NULL) {
      fprintf(stderr, "No configuration file found, please specify a configuration file path\n");
      return 0;
    }
    
    return 1;
  } else {
    return 0;
  }
  
}

/**
 * Initialize the application configuration based on the config file content
 * Read the config file, get mandatory variables and devices
 */
int build_config_from_file(struct config_elements * config) {
  
  config_t cfg;
  config_setting_t * root, * database, * mime_type_list, * mime_type, * oidc_cfg;
  const char * cur_prefix, * cur_external_url, * cur_log_mode, * cur_log_level, * cur_log_file = NULL, * one_log_mode, * cur_allow_origin,
             * db_type, * db_sqlite_path, * db_mariadb_host = NULL, * db_mariadb_user = NULL, * db_pg_conninfo = NULL,
             * db_mariadb_password = NULL, * db_mariadb_dbname = NULL, * cur_static_files_path = NULL, * extension = NULL, * mime_type_value = NULL, * cur_sign_key = NULL;
  char * str_jwks = NULL;
  int db_mariadb_port = 0, i = 0, port = 0, sign_exp = 0, compress = 0, ret;
  const char * cur_oidc_server_remote_config = NULL, * cur_oidc_server_public_jwks = NULL, * cur_oidc_iss = NULL, * cur_oidc_realm = NULL,
             * cur_oidc_aud = NULL, * cur_oidc_scope = NULL;
  int cur_oidc_dpop_max_iat = 0, cur_oidc_server_remote_config_verify_cert = 0;
  
  config_init(&cfg);
  
  if (!config_read_file(&cfg, config->config_file)) {
    fprintf(stderr, "Error parsing config file %s\nOn line %d error: %s\n", config_error_file(&cfg), config_error_line(&cfg), config_error_text(&cfg));
    config_destroy(&cfg);
    ret = 0;
  } else {
    ret = 1;
    do {
      root = config_root_setting(&cfg);
      
      if (config_lookup_int(&cfg, "port", &port) == CONFIG_TRUE) {
        config->port = (uint)port;
      }
      
      if (config_lookup_string(&cfg, "external_url", &cur_external_url) == CONFIG_TRUE) {
        o_free(config->external_url);
        if ((config->external_url = o_strdup(cur_external_url)) == NULL) {
          fprintf(stderr, "Error setting config->external_url, exiting\n");
          ret = 0;
          break;
        }
      }
      
      if (config_lookup_string(&cfg, "api_prefix", &cur_prefix) == CONFIG_TRUE) {
        o_free(config->api_prefix);
        if ((config->api_prefix = o_strdup(cur_prefix)) == NULL) {
          fprintf(stderr, "Error setting config->api_prefix, exiting\n");
          ret = 0;
          break;
        }
      }
      
      if (config_lookup_string(&cfg, "allow_origin", &cur_allow_origin) == CONFIG_TRUE) {
        if ((config->allow_origin = o_strdup(cur_allow_origin)) == NULL) {
          fprintf(stderr, "Error setting config->allow_origin, exiting\n");
          ret = 0;
          break;
        }
      }

      if (config_lookup_string(&cfg, "log_mode", &cur_log_mode) == CONFIG_TRUE) {
        one_log_mode = strtok((char *)cur_log_mode, ",");
        while (one_log_mode != NULL) {
          if (0 == o_strncmp("console", one_log_mode, strlen("console"))) {
            config->log_mode |= Y_LOG_MODE_CONSOLE;
          } else if (0 == o_strncmp("syslog", one_log_mode, strlen("syslog"))) {
            config->log_mode |= Y_LOG_MODE_SYSLOG;
          } else if (0 == o_strncmp("file", one_log_mode, strlen("file"))) {
            config->log_mode |= Y_LOG_MODE_FILE;
            // Get log file path
            if (config_lookup_string(&cfg, "log_file", &cur_log_file)) {
              o_free(config->log_file);
              if ((config->log_file = o_strdup(cur_log_file)) == NULL) {
                fprintf(stderr, "Error allocating config->log_file, exiting\n");
                ret = 0;
                break;
              }
            }
          }
          one_log_mode = strtok(NULL, ",");
        }
      }
      
      if (config_lookup_string(&cfg, "log_level", &cur_log_level) == CONFIG_TRUE) {
        if (0 == o_strncmp("NONE", cur_log_level, strlen("NONE"))) {
          config->log_level = Y_LOG_LEVEL_NONE;
        } else if (0 == o_strncmp("ERROR", cur_log_level, strlen("ERROR"))) {
          config->log_level = Y_LOG_LEVEL_ERROR;
        } else if (0 == o_strncmp("WARNING", cur_log_level, strlen("WARNING"))) {
          config->log_level = Y_LOG_LEVEL_WARNING;
        } else if (0 == o_strncmp("INFO", cur_log_level, strlen("INFO"))) {
          config->log_level = Y_LOG_LEVEL_INFO;
        } else if (0 == o_strncmp("DEBUG", cur_log_level, strlen("DEBUG"))) {
          config->log_level = Y_LOG_LEVEL_DEBUG;
        }
      }
      
      database = config_setting_get_member(root, "database");
      if (database != NULL) {
        if (config_setting_lookup_string(database, "type", &db_type) == CONFIG_TRUE) {
          if (0 == o_strcmp(db_type, "sqlite3")) {
            if (config_setting_lookup_string(database, "path", &db_sqlite_path) == CONFIG_TRUE) {
              config->conn = h_connect_sqlite(db_sqlite_path);
              if (config->conn == NULL) {
                fprintf(stderr, "Error opening sqlite database %s, exiting\n", db_sqlite_path);
                ret = 0;
                break;
              } else {
                if (h_exec_query_sqlite(config->conn, "PRAGMA foreign_keys = ON;") != H_OK) {
                  y_log_message(Y_LOG_LEVEL_ERROR, "Error executing sqlite3 query 'PRAGMA foreign_keys = ON;, exiting'");
                  ret = 0;
                  break;
                }
              }
            } else {
              fprintf(stderr, "Error - no sqlite database specified\n");
              ret = 0;
              break;
            }
          } else if (0 == o_strcmp(db_type, "mariadb")) {
            config_setting_lookup_string(database, "host", &db_mariadb_host);
            config_setting_lookup_string(database, "user", &db_mariadb_user);
            config_setting_lookup_string(database, "password", &db_mariadb_password);
            config_setting_lookup_string(database, "dbname", &db_mariadb_dbname);
            config_setting_lookup_int(database, "port", &db_mariadb_port);
            config->conn = h_connect_mariadb(db_mariadb_host, db_mariadb_user, db_mariadb_password, db_mariadb_dbname, db_mariadb_port, NULL);
            if (config->conn == NULL) {
              fprintf(stderr, "Error opening mariadb database %s\n", db_mariadb_dbname);
              ret = 0;
              break;
            } else {
              if (h_execute_query_mariadb(config->conn, "SET sql_mode='PIPES_AS_CONCAT';", NULL) != H_OK) {
                y_log_message(Y_LOG_LEVEL_ERROR, "Error executing mariadb query 'SET sql_mode='PIPES_AS_CONCAT';', exiting");
                ret = 0;
                break;
              }
            }
          } else if (0 == o_strcmp(db_type, "postgre")) {
            config_setting_lookup_string(database, "conninfo", &db_pg_conninfo);
            config->conn = h_connect_pgsql(db_pg_conninfo);
            if (config->conn == NULL) {
              fprintf(stderr, "Error opening postgre database %s, exiting\n", db_pg_conninfo);
              ret = 0;
              break;
            }
          } else {
            fprintf(stderr, "Error - database type unknown\n");
            ret = 0;
            break;
          }
        } else {
          fprintf(stderr, "Error - no database type found\n");
          ret = 0;
          break;
        }
      } else {
        fprintf(stderr, "Error - no database setting found\n");
        ret = 0;
        break;
      }

      if (config_lookup_string(&cfg, "app_files_path", &cur_static_files_path) == CONFIG_TRUE) {
        config->static_file_config->files_path = o_strdup(cur_static_files_path);
        if (config->static_file_config->files_path == NULL) {
          fprintf(stderr, "Error allocating config->static_file_config->files_path, exiting\n");
          ret = 0;
          break;
        }
      }

      // Populate mime types u_map
      mime_type_list = config_lookup(&cfg, "app_files_mime_types");
      if (mime_type_list != NULL) {
        for (i=0; i<config_setting_length(mime_type_list); i++) {
          mime_type = config_setting_get_elem(mime_type_list, i);
          if (mime_type != NULL) {
            if (config_setting_lookup_string(mime_type, "extension", &extension) == CONFIG_TRUE &&
                config_setting_lookup_string(mime_type, "mime_type", &mime_type_value) == CONFIG_TRUE) {
              u_map_put(&config->static_file_config->mime_types, extension, mime_type_value);
              if (config_setting_lookup_int(mime_type, "compress", &compress) == CONFIG_TRUE) {
                if (compress && u_add_mime_types_compressed(config->static_file_config, mime_type_value) != U_OK) {
                  fprintf(stderr, "Error setting mime_type %s to compressed list, exiting\n", mime_type_value);
                  ret = 0;
                  break;
                }
              }
            }
          }
        }
      }
      
      oidc_cfg = config_lookup(&cfg, "oidc");
      if (config_setting_lookup_string(oidc_cfg, "server_remote_config", &cur_oidc_server_remote_config) == CONFIG_TRUE) {
        if ((config->oidc_server_remote_config = o_strdup(cur_oidc_server_remote_config)) == NULL) {
          fprintf(stderr, "Error allocating config->oidc_server_remote_config, exiting\n");
          ret = 0;
          break;
        }
      }
      if (config_setting_lookup_bool(oidc_cfg, "server_remote_config_verify_cert", &cur_oidc_server_remote_config_verify_cert) == CONFIG_TRUE) {
        config->oidc_server_remote_config_verify_cert = (time_t)cur_oidc_server_remote_config_verify_cert;
      }
      if (config_setting_lookup_string(oidc_cfg, "server_public_jwks", &cur_oidc_server_public_jwks) == CONFIG_TRUE) {
        if ((config->oidc_server_public_jwks = o_strdup(cur_oidc_server_public_jwks)) == NULL) {
          fprintf(stderr, "Error allocating config->oidc_server_public_jwks, exiting\n");
          ret = 0;
          break;
        }
      }
      if (config_setting_lookup_string(oidc_cfg, "iss", &cur_oidc_iss) == CONFIG_TRUE) {
        if ((config->oidc_iss = o_strdup(cur_oidc_iss)) == NULL) {
          fprintf(stderr, "Error allocating config->oidc_iss, exiting\n");
          ret = 0;
          break;
        }
      }
      if (config_setting_lookup_string(oidc_cfg, "realm", &cur_oidc_realm) == CONFIG_TRUE) {
        if ((config->oidc_realm = o_strdup(cur_oidc_realm)) == NULL) {
          fprintf(stderr, "Error allocating config->oidc_realm, exiting\n");
          ret = 0;
          break;
        }
      }
      if (config_setting_lookup_string(oidc_cfg, "aud", &cur_oidc_aud) == CONFIG_TRUE) {
        if ((config->oidc_aud = o_strdup(cur_oidc_aud)) == NULL) {
          fprintf(stderr, "Error allocating config->oidc_aud, exiting\n");
          ret = 0;
          break;
        }
      }
      if (config_setting_lookup_int(oidc_cfg, "dpop_max_iat", &cur_oidc_dpop_max_iat) == CONFIG_TRUE) {
        config->oidc_dpop_max_iat = (time_t)cur_oidc_dpop_max_iat;
      }
      
      if (config_lookup_string(&cfg, "hutch_scope", &cur_oidc_scope) == CONFIG_TRUE) {
        config->oidc_scope = o_strdup(cur_oidc_scope);
        if (config->oidc_scope == NULL) {
          fprintf(stderr, "Error allocating config->oidc_scope, exiting\n");
          ret = 0;
          break;
        }
      }
      
      if (config_lookup_string(&cfg, "sign_key", &cur_sign_key) == CONFIG_TRUE) {
        if ((str_jwks = get_file_content(cur_sign_key)) != NULL) {
          if (r_jwks_import_from_json_str(config->sign_key, str_jwks) != RHN_OK) {
            fprintf(stderr, "Invalid sign_key content, exiting\n");
            ret = 0;
            break;
          }
          o_free(str_jwks);
        } else {
          fprintf(stderr, "Invalid sign_key path, exiting\n");
          ret = 0;
          break;
        }
      }
      
      if (config_lookup_int(&cfg, "sign_exp", &sign_exp) == CONFIG_TRUE) {
        config->sign_exp = (time_t)sign_exp;
      }
    } while (0);
    config_destroy(&cfg);
  }
  
  return ret;
}

/**
 * Print help message to output file specified
 */
void print_help(FILE * output) {
  fprintf(output, "\nHutch - Password and private data locker\n");
  fprintf(output, "\n");
  fprintf(output, "Version %s\n", _HUTCH_VERSION_);
  fprintf(output, "\n");
  fprintf(output, "Copyright 2017-2021 Nicolas Mora <mail@babelouest.org>\n");
  fprintf(output, "\n");
  fprintf(output, "This program is free software; you can redistribute it and/or\n");
  fprintf(output, "modify it under the terms of the GNU GENERAL PUBLIC LICENSE\n");
  fprintf(output, "License as published by the Free Software Foundation;\n");
  fprintf(output, "version 3 of the License.\n");
  fprintf(output, "\n");
  fprintf(output, "Command-line options:\n");
  fprintf(output, "\n");
  fprintf(output, "-c --config-file=PATH\n");
  fprintf(output, "\tPath to configuration file\n");
  fprintf(output, "-p --port=PORT\n");
  fprintf(output, "\tPort to listen to\n");
  fprintf(output, "-u --url-prefix=PREFIX\n");
  fprintf(output, "\tAPI URL prefix\n");
  fprintf(output, "-m --log-mode=MODE\n");
  fprintf(output, "\tLog Mode\n");
  fprintf(output, "\tconsole, syslog or file\n");
  fprintf(output, "\tIf you want multiple modes, separate them with a comma \",\"\n");
  fprintf(output, "\tdefault: console\n");
  fprintf(output, "-l --log-level=LEVEL\n");
  fprintf(output, "\tLog level\n");
  fprintf(output, "\tNONE, ERROR, WARNING, INFO, DEBUG\n");
  fprintf(output, "\tdefault: ERROR\n");
  fprintf(output, "-f --log-file=PATH\n");
  fprintf(output, "\tPath for log file if log mode file is specified\n");
  fprintf(output, "-h --help\n");
  fprintf(output, "-v --version\n");
  fprintf(output, "\tPrint this message\n\n");
}

/**
 * handles signal catch to exit properly when ^C is used for example
 * I don't like global variables but it looks fine to people who designed this
 */
void exit_handler(int signal) {
  y_log_message(Y_LOG_LEVEL_INFO, "Hutch caught a stop or kill signal (%d), exiting", signal);
  pthread_mutex_lock(&global_handler_close_lock);
  pthread_cond_signal(&global_handler_close_cond);
  pthread_mutex_unlock(&global_handler_close_lock);
}

/**
 * Check if all mandatory configuration parameters are present and correct
 * Initialize some parameters with default value if not set
 */
int check_config(struct config_elements * config) {
  int ret = 1, type;
  size_t i;
  jwk_t * jwk;
  
  do {
    if (!config->port || config->port > 65535) {
      fprintf(stderr, "Invalid port number, exiting\n");
      ret = 0;
      break;
    }
    
    if (!o_strlen(config->external_url)) {
      fprintf(stderr, "external_url missing, exiting\n");
      ret = 0;
      break;
    }
    
    if (!r_jwks_size(config->sign_key)) {
      fprintf(stderr, "Empty signing jwks, exiting\n");
      ret = 0;
      break;
    }
    
    for (i=0; i<r_jwks_size(config->sign_key); i++) {
      jwk = r_jwks_get_at(config->sign_key, i);
      type = r_jwk_key_type(jwk, NULL, 0);
      if (!(type & R_KEY_TYPE_PRIVATE)) {
        fprintf(stderr, "Invalid jwk at index %zu, must be a private key, exiting\n", i);
        ret = 0;
      }
      if (!o_strlen(r_jwk_get_property_str(jwk, "kid"))) {
        fprintf(stderr, "Invalid jwk at index %zu, kid property missing, exiting\n", i);
        ret = 0;
      }
      if (!o_strlen(r_jwk_get_property_str(jwk, "alg"))) {
        fprintf(stderr, "Invalid jwk at index %zu, alg property missing, exiting\n", i);
        ret = 0;
      }
      r_jwk_free(jwk);
    }
  } while (0);
  
  return ret;
}

/**
 * Return the source ip address of the request
 * Based on the header value "X-Forwarded-For" if set, which means the request is forwarded by a proxy
 * otherwise the call is direct, return the client_address
 */
const char * get_ip_source(const struct _u_request * request) {
  const char * ip_source = u_map_get(request->map_header, "X-Forwarded-For");
  
  if (ip_source == NULL) {
    struct sockaddr_in * in_source = (struct sockaddr_in *)request->client_address;
    if (in_source != NULL) {
      ip_source = inet_ntoa(in_source->sin_addr);
    } else {
      ip_source = "NOT_FOUND";
    }
  }
  
  return ip_source;
};

/**
 * Converts a hex character to its integer value
 */
char from_hex(char ch) {
  return isdigit(ch) ? ch - '0' : tolower(ch) - 'a' + 10;
}

/**
 * Converts an integer value to its hex character
 */
char to_hex(char code) {
  static char hex[] = "0123456789abcdef";
  return hex[code & 15];
}

/**
 * Returns a url-encoded version of str
 * IMPORTANT: be sure to free() the returned string after use 
 * Thanks Geek Hideout!
 * http://www.geekhideout.com/urlcode.shtml
 */
char * url_encode(char * str) {
  char * pstr = str, * buf = malloc(strlen(str) * 3 + 1), * pbuf = buf;
  while (* pstr) {
    if (isalnum(* pstr) || * pstr == '-' || * pstr == '_' || * pstr == '.' || * pstr == '~') 
      * pbuf++ = * pstr;
    else if (* pstr == ' ') 
      * pbuf++ = '+';
    else 
      * pbuf++ = '%', * pbuf++ = to_hex(* pstr >> 4), * pbuf++ = to_hex(* pstr & 15);
    pstr++;
  }
  * pbuf = '\0';
  return buf;
}

/**
 * Returns a url-decoded version of str
 * IMPORTANT: be sure to free() the returned string after use
 * Thanks Geek Hideout!
 * http://www.geekhideout.com/urlcode.shtml
 */
char * url_decode(char * str) {
  char * pstr = str, * buf = malloc(strlen(str) + 1), * pbuf = buf;
  while (* pstr) {
    if (* pstr == '%') {
      if (pstr[1] && pstr[2]) {
        * pbuf++ = from_hex(pstr[1]) << 4 | from_hex(pstr[2]);
        pstr += 2;
      }
    } else if (* pstr == '+') { 
      * pbuf++ = ' ';
    } else {
      * pbuf++ = * pstr;
    }
    pstr++;
  }
  * pbuf = '\0';
  return buf;
}

/**
 *
 * Read the content of a file and return it as a char *
 * returned value must be free'd after use
 *
 */
char * get_file_content(const char * file_path) {
  char * buffer = NULL;
  size_t length, res;
  FILE * f;

  f = fopen (file_path, "rb");
  if (f) {
    fseek (f, 0, SEEK_END);
    length = ftell (f);
    fseek (f, 0, SEEK_SET);
    buffer = malloc((length+1)*sizeof(char));
    if (buffer) {
      res = fread (buffer, 1, length, f);
      if (res != length) {
        fprintf(stderr, "fread warning, reading %zu while expecting %zu", res, length);
      }
      // Add null character at the end of buffer, just in case
      buffer[length] = '\0';
    }
    fclose (f);
  }
  
  return buffer;
}

/**
 * Check if the result json object has a "result" element that is equal to value
 */
int check_result_value(json_t * result, const int value) {
  return (json_is_integer(json_object_get(result, "result")) && 
          json_integer_value(json_object_get(result, "result")) == value);
}

char * serialize_json_to_jwt(struct config_elements * config, const char * sign_kid, json_t * j_claims, const char * str_slaims) {
  jwt_t * jwt = NULL;
  jwk_t * jwk;
  char * token = NULL;
  time_t now;
  
  if (o_strlen(sign_kid)) {
    jwk = r_jwks_get_by_kid(config->sign_key, sign_kid);
  } else {
    jwk = r_jwks_get_at(config->sign_key, 0);
  }
  if (jwk != NULL) {
    do {
      time(&now);
      
      if (r_jwt_init(&jwt) != RHN_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_init");
        break;
      }
      
      if (r_jwt_set_header_int_value(jwt, "iat", now) != RHN_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_set_header_int_value iat");
        break;
      }
      
      if (r_jwt_set_header_int_value(jwt, "exp", now+config->sign_exp) != RHN_OK) {
        y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_set_header_int_value exp");
        break;
      }
      
      if (j_claims != NULL) {
        if (r_jwt_set_full_claims_json_t(jwt, j_claims) != RHN_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_set_full_claims_json_t");
          break;
        }
      }
      
      if (str_slaims != NULL) {
        if (r_jwt_set_full_claims_json_str(jwt, str_slaims) != RHN_OK) {
          y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_set_full_claims_json_str");
          break;
        }
      }
      
      if ((token = r_jwt_serialize_signed(jwt, jwk, 0)) == NULL) {
        y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error r_jwt_serialize_signed");
        break;
      }
    } while (0);
    r_jwt_free(jwt);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "serialize_json_to_jwt - Error getting sign key '%s'", sign_kid);
  }
  r_jwk_free(jwk);
  return token;
}
