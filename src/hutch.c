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

#include <getopt.h>
#include <signal.h>
#include <ctype.h>
#include <libconfig.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <string.h>

#include "hutch.h"

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
  
  srand(time(NULL));
  if (config == NULL) {
    fprintf(stderr, "Memory error - config\n");
    return 1;
  }
  
  // Init config structure with default values
  config->config_file = NULL;
  config->api_prefix = NULL;
  config->log_mode = Y_LOG_MODE_NONE;
  config->log_level = Y_LOG_LEVEL_NONE;
  config->log_file = NULL;
  config->conn = NULL;
  config->instance = malloc(sizeof(struct _u_instance));
  config->allow_origin = NULL;
  config->app_files_path = NULL;
  config->app_prefix = NULL;
  config->glewlwyd_resource_config = malloc(sizeof(struct _glewlwyd_resource_config));
  config->secure_connection_key_file = NULL;
  config->secure_connection_pem_file = NULL;
  if (config->instance == NULL || config->glewlwyd_resource_config == NULL) {
    fprintf(stderr, "Memory error - config->instance || config->glewlwyd_resource_config\n");
    return 1;
  }
  ulfius_init_instance(config->instance, -1, NULL);
  config->glewlwyd_resource_config->method = G_METHOD_HEADER;
  config->glewlwyd_resource_config->realm = NULL;
  config->glewlwyd_resource_config->oauth_scope = NULL;
  config->glewlwyd_resource_config->jwt_decode_key = NULL;
  config->glewlwyd_resource_config->jwt_alg = JWT_ALG_NONE;

  config->mime_types = malloc(sizeof(struct _u_map));
  if (config->mime_types == NULL) {
    y_log_message(Y_LOG_LEVEL_ERROR, "init - Error allocating resources for config->mime_types, aborting");
    exit_server(&config, HUTCH_ERROR);
  }
  u_map_init(config->mime_types);
  u_map_put(config->mime_types, "*", "application/octet-stream");
  
  global_handler_variable = HUTCH_RUNNING;
  // Catch end signals to make a clean exit
  signal (SIGQUIT, exit_handler);
  signal (SIGINT, exit_handler);
  signal (SIGTERM, exit_handler);
  signal (SIGHUP, exit_handler);

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
  
  // At this point, we declare all API endpoints and configure 
  
  // Profile endpoint
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/profile/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_profile_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/profile/history", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_profile_get_history, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/profile/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_profile_set, (void*)config);
  
  // Safe endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_get_list, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/history", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_get_history, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "POST", config->api_prefix, "/safe/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_add, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/safe/:safe", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/safe/:safe", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_safe_delete, (void*)config);

  // Coin endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/coin/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_get_list, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/coin/:coin", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_get, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->api_prefix, "/safe/:safe/coin/:coin/history", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_get_history, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "POST", config->api_prefix, "/safe/:safe/coin/", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_add, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "PUT", config->api_prefix, "/safe/:safe/coin/:coin", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_set, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "DELETE", config->api_prefix, "/safe/:safe/coin/:coin", &callback_check_glewlwyd_access_token, config->glewlwyd_resource_config, NULL, &callback_hutch_coin_delete, (void*)config);
  
  // Other endpoints
  ulfius_add_endpoint_by_val(config->instance, "GET", "/", NULL, NULL, NULL, NULL, &callback_hutch_root, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", "/config/", NULL, NULL, NULL, NULL, &callback_hutch_server_configuration, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "OPTIONS", NULL, "*", NULL, NULL, NULL, &callback_hutch_options, (void*)config);
  ulfius_add_endpoint_by_val(config->instance, "GET", config->app_prefix, "*", NULL, NULL, NULL, &callback_hutch_static_file, (void*)config);
  ulfius_set_default_endpoint(config->instance, NULL, NULL, NULL, &callback_default, (void*)config);

  // Set default headers
  u_map_put(config->instance->default_headers, "Access-Control-Allow-Origin", config->allow_origin);
  u_map_put(config->instance->default_headers, "Access-Control-Allow-Credentials", "true");
  u_map_put(config->instance->default_headers, "Cache-Control", "no-store");
  u_map_put(config->instance->default_headers, "Pragma", "no-cache");

  y_log_message(Y_LOG_LEVEL_INFO, "Start hutch on port %d, prefix: %s, secure: %s, scope %s", config->instance->port, config->api_prefix, config->use_secure_connection?"true":"false", config->glewlwyd_resource_config->oauth_scope);
  
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
    // Loop until stop signal is broadcasted
    while (global_handler_variable == HUTCH_RUNNING) {
      sleep(1);
    }
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error starting glewlwyd webserver");
    exit_server(&config, HUTCH_ERROR);
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
    free((*config)->log_file);
    free((*config)->allow_origin);
    free((*config)->app_files_path);
    free((*config)->app_prefix);
    free((*config)->secure_connection_key_file);
    free((*config)->secure_connection_pem_file);
    free((*config)->glewlwyd_resource_config->oauth_scope);
    free((*config)->glewlwyd_resource_config->jwt_decode_key);
    free((*config)->glewlwyd_resource_config);
    
    u_map_clean_full((*config)->mime_types);
    h_close_db((*config)->conn);
    h_clean_connection((*config)->conn);
    ulfius_stop_framework((*config)->instance);
    ulfius_clean_instance((*config)->instance);
    free((*config)->instance);
    y_close_logs();
    
    free(*config);
    (*config) = NULL;
  }
  exit(exit_value);
}

/**
 * Initialize the application configuration based on the command line parameters
 */
int build_config_from_args(int argc, char ** argv, struct config_elements * config) {
  int next_option;
  const char * short_options = "c::p::u::m::l::f::h::";
  char * tmp = NULL, * to_free = NULL, * one_log_mode = NULL;
  static const struct option long_options[]= {
    {"config-file", optional_argument, NULL, 'c'},
    {"port", optional_argument, NULL, 'p'},
    {"url-prefix", optional_argument, NULL, 'u'},
    {"log-mode", optional_argument, NULL, 'm'},
    {"log-level", optional_argument, NULL, 'l'},
    {"log-file", optional_argument, NULL, 'f'},
    {"help", optional_argument, NULL, 'h'},
    {NULL, 0, NULL, 0}
  };
  
  if (config != NULL) {
    do {
      next_option = getopt_long(argc, argv, short_options, long_options, NULL);
      
      switch (next_option) {
        case 'c':
          if (optarg != NULL) {
            config->config_file = nstrdup(optarg);
            if (config->config_file == NULL) {
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
            config->instance->port = strtol(optarg, NULL, 10);
            if (config->instance->port <= 0 || config->instance->port > 65535) {
              fprintf(stderr, "Error!\nInvalid TCP Port number\n\tPlease specify an integer value between 1 and 65535");
              return 0;
            }
          } else {
            fprintf(stderr, "Error!\nNo TCP Port number specified\n");
            return 0;
          }
          break;
        case 'u':
          if (optarg != NULL) {
            config->api_prefix = nstrdup(optarg);
            if (config->api_prefix == NULL) {
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
            tmp = nstrdup(optarg);
            if (tmp == NULL) {
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
            config->log_file = nstrdup(optarg);
            if (config->log_file == NULL) {
              fprintf(stderr, "Error allocating config->log_file, exiting\n");
              exit_server(&config, HUTCH_STOP);
            }
          } else {
            fprintf(stderr, "Error!\nNo log file specified\n");
            return 0;
          }
          break;
        case 'h':
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
 * Print help message to output file specified
 */
void print_help(FILE * output) {
  fprintf(output, "\nHutch\n");
  fprintf(output, "\n");
  fprintf(output, "Password and private data locker\n");
  fprintf(output, "\n");
  fprintf(output, "-c --config-file=PATH\n");
  fprintf(output, "\tPath to configuration file\n");
  fprintf(output, "-p --port=PORT\n");
  fprintf(output, "\tPort to listen to\n");
  fprintf(output, "-u --url-prefix=PREFIX\n");
  fprintf(output, "\tURL prefix\n");
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
  fprintf(output, "\tPrint this message\n\n");
}

/**
 * handles signal catch to exit properly when ^C is used for example
 * I don't like global variables but it looks fine to people who designed this
 */
void exit_handler(int signal) {
  y_log_message(Y_LOG_LEVEL_INFO, "Hutch caught a stop or kill signal (%d), exiting", signal);
  global_handler_variable = HUTCH_STOP;
}

/**
 * Initialize the application configuration based on the config file content
 * Read the config file, get mandatory variables and devices
 */
int build_config_from_file(struct config_elements * config) {
  
  config_t cfg;
  config_setting_t * root, * database, * jwt;
  const char * cur_prefix, * cur_log_mode, * cur_log_level, * cur_log_file = NULL, * one_log_mode, * cur_allow_origin, * cur_static_files_prefix, * db_type, * db_sqlite_path, * db_mariadb_host = NULL, * db_mariadb_user = NULL, * db_mariadb_password = NULL, * db_mariadb_dbname = NULL, * cur_static_files_path = NULL, * cur_rsa_pub_file = NULL, * cur_sha_secret = NULL, * cur_oauth_scope = NULL;
  int db_mariadb_port = 0, cur_use_rsa = 0, cur_use_sha = 0;
  
  config_init(&cfg);
  
  if (!config_read_file(&cfg, config->config_file)) {
    fprintf(stderr, "Error parsing config file %s\nOn line %d error: %s\n", config_error_file(&cfg), config_error_line(&cfg), config_error_text(&cfg));
    config_destroy(&cfg);
    return 0;
  }
  
  if (config->instance->port == -1) {
    // Get Port number to listen to
    config_lookup_int(&cfg, "port", &(config->instance->port));
  }
  
  if (config->api_prefix == NULL) {
    // Get prefix url for angharad
    if (config_lookup_string(&cfg, "api_prefix", &cur_prefix)) {
      config->api_prefix = nstrdup(cur_prefix);
      if (config->api_prefix == NULL) {
        fprintf(stderr, "Error allocating config->api_prefix, exiting\n");
        config_destroy(&cfg);
        return 0;
      }
    }
  }

  if (config->allow_origin == NULL) {
    // Get allow-origin value for CORS
    if (config_lookup_string(&cfg, "allow_origin", &cur_allow_origin)) {
      config->allow_origin = nstrdup(cur_allow_origin);
      if (config->allow_origin == NULL) {
        fprintf(stderr, "Error allocating config->allow_origin, exiting\n");
        config_destroy(&cfg);
        return 0;
      }
    }
  }

  if (config->log_mode == Y_LOG_MODE_NONE) {
    // Get log mode
    if (config_lookup_string(&cfg, "log_mode", &cur_log_mode)) {
      one_log_mode = strtok((char *)cur_log_mode, ",");
      while (one_log_mode != NULL) {
        if (0 == nstrncmp("console", one_log_mode, strlen("console"))) {
          config->log_mode |= Y_LOG_MODE_CONSOLE;
        } else if (0 == nstrncmp("syslog", one_log_mode, strlen("syslog"))) {
          config->log_mode |= Y_LOG_MODE_SYSLOG;
        } else if (0 == nstrncmp("file", one_log_mode, strlen("file"))) {
          config->log_mode |= Y_LOG_MODE_FILE;
          // Get log file path
          if (config->log_file == NULL) {
            if (config_lookup_string(&cfg, "log_file", &cur_log_file)) {
              config->log_file = nstrdup(cur_log_file);
              if (config->log_file == NULL) {
                fprintf(stderr, "Error allocating config->log_file, exiting\n");
                config_destroy(&cfg);
                return 0;
              }
            }
          }
        }
        one_log_mode = strtok(NULL, ",");
      }
    }
  }
  
  if (config->log_level == Y_LOG_LEVEL_NONE) {
    // Get log level
    if (config_lookup_string(&cfg, "log_level", &cur_log_level)) {
      if (0 == nstrncmp("NONE", cur_log_level, strlen("NONE"))) {
        config->log_level = Y_LOG_LEVEL_NONE;
      } else if (0 == nstrncmp("ERROR", cur_log_level, strlen("ERROR"))) {
        config->log_level = Y_LOG_LEVEL_ERROR;
      } else if (0 == nstrncmp("WARNING", cur_log_level, strlen("WARNING"))) {
        config->log_level = Y_LOG_LEVEL_WARNING;
      } else if (0 == nstrncmp("INFO", cur_log_level, strlen("INFO"))) {
        config->log_level = Y_LOG_LEVEL_INFO;
      } else if (0 == nstrncmp("DEBUG", cur_log_level, strlen("DEBUG"))) {
        config->log_level = Y_LOG_LEVEL_DEBUG;
      }
    }
  }

  if (!y_init_logs(HUTCH_LOG_NAME, config->log_mode, config->log_level, config->log_file, "Starting Hutch Server")) {
    fprintf(stderr, "Error initializing logs\n");
    exit_server(&config, HUTCH_ERROR);
  }
    
  root = config_root_setting(&cfg);
  database = config_setting_get_member(root, "database");
  if (database != NULL) {
    if (config_setting_lookup_string(database, "type", &db_type) == CONFIG_TRUE) {
      if (0 == nstrncmp(db_type, "sqlite3", strlen("sqlite3"))) {
        if (config_setting_lookup_string(database, "path", &db_sqlite_path) == CONFIG_TRUE) {
          config->conn = h_connect_sqlite(db_sqlite_path);
          if (config->conn == NULL) {
            config_destroy(&cfg);
            fprintf(stderr, "Error opening sqlite database %s\n", db_sqlite_path);
            return 0;
          }
        } else {
          config_destroy(&cfg);
          fprintf(stderr, "Error, no sqlite database specified\n");
          return 0;
        }
      } else if (0 == nstrncmp(db_type, "mariadb", strlen("mariadb"))) {
        config_setting_lookup_string(database, "host", &db_mariadb_host);
        config_setting_lookup_string(database, "user", &db_mariadb_user);
        config_setting_lookup_string(database, "password", &db_mariadb_password);
        config_setting_lookup_string(database, "dbname", &db_mariadb_dbname);
        config_setting_lookup_int(database, "port", &db_mariadb_port);
        config->conn = h_connect_mariadb(db_mariadb_host, db_mariadb_user, db_mariadb_password, db_mariadb_dbname, db_mariadb_port, NULL);
        if (config->conn == NULL) {
          fprintf(stderr, "Error opening mariadb database %s\n", db_mariadb_dbname);
          config_destroy(&cfg);
          return 0;
        }
      } else {
        config_destroy(&cfg);
        fprintf(stderr, "Error, database type unknown\n");
        return 0;
      }
    } else {
      config_destroy(&cfg);
      fprintf(stderr, "Error, no database type found\n");
      return 0;
    }
  } else {
    config_destroy(&cfg);
    fprintf(stderr, "Error, no database setting found\n");
    return 0;
  }

  if (config->app_files_path == NULL) {
    // Get path that serve static files
    if (config_lookup_string(&cfg, "app_files_path", &cur_static_files_path)) {
      config->app_files_path = nstrdup(cur_static_files_path);
      if (config->app_files_path == NULL) {
        fprintf(stderr, "Error allocating config->app_files_path, exiting\n");
        config_destroy(&cfg);
        return 0;
      }
    }
  }

  if (config->app_prefix == NULL) {
    // Get prefix url
    if (config_lookup_string(&cfg, "app_prefix", &cur_static_files_prefix)) {
      config->app_prefix = nstrdup(cur_static_files_prefix);
      if (config->app_prefix == NULL) {
        fprintf(stderr, "Error allocating config->app_prefix, exiting\n");
        config_destroy(&cfg);
        return 0;
      }
    }
  }
  
  jwt = config_setting_get_member(root, "jwt");
  if (jwt != NULL) {
    config_setting_lookup_bool(jwt, "use_rsa", &cur_use_rsa);
    config_setting_lookup_bool(jwt, "use_sha", &cur_use_sha);
    if (cur_use_rsa) {
      config_setting_lookup_string(jwt, "rsa_pub_file", &cur_rsa_pub_file);
      if (cur_rsa_pub_file != NULL) {
        config->glewlwyd_resource_config->jwt_decode_key = get_file_content(cur_rsa_pub_file);
        config->glewlwyd_resource_config->jwt_alg = JWT_ALG_RS512;
        if (config->glewlwyd_resource_config->jwt_decode_key == NULL) {
          config_destroy(&cfg);
          fprintf(stderr, "Error, rsa_pub_file content incorrect\n");
          return 0;
        }
      } else {
        config_destroy(&cfg);
        fprintf(stderr, "Error, rsa_pub_file incorrect\n");
        return 0;
      }
    } else if (cur_use_sha) {
      config_setting_lookup_string(jwt, "sha_secret", &cur_sha_secret);
      if (cur_sha_secret != NULL) {
        config->glewlwyd_resource_config->jwt_decode_key = nstrdup(cur_sha_secret);
        config->glewlwyd_resource_config->jwt_alg = JWT_ALG_HS512;
      } else {
        config_destroy(&cfg);
        fprintf(stderr, "Error, sha_secret incorrect\n");
        return 0;
      }
    } else {
      config_destroy(&cfg);
      fprintf(stderr, "Error, no jwt algorithm selected\n");
      return 0;
    }
  }
  
  if (config_lookup_string(&cfg, "oauth_scope", &cur_oauth_scope)) {
    config->glewlwyd_resource_config->oauth_scope = nstrdup(cur_oauth_scope);
    if (config->glewlwyd_resource_config->oauth_scope == NULL) {
      fprintf(stderr, "Error allocating config->oauth_scope, exiting\n");
      config_destroy(&cfg);
      return 0;
    }
  }
  
  config_destroy(&cfg);
  return 1;
}

/**
 * Check if all mandatory configuration parameters are present and correct
 * Initialize some parameters with default value if not set
 */
int check_config(struct config_elements * config) {

  if (config->instance->port == -1) {
    config->instance->port = HUTCH_DEFAULT_PORT;
  }
  
  if (config->api_prefix == NULL) {
    config->api_prefix = nstrdup(HUTCH_DEFAULT_PREFIX);
    if (config->api_prefix == NULL) {
      fprintf(stderr, "Error allocating api_prefix, exit\n");
      return 0;
    }
  }
  
  if (config->log_mode == Y_LOG_MODE_NONE) {
    config->log_mode = Y_LOG_MODE_CONSOLE;
  }
  
  if (config->log_level == Y_LOG_LEVEL_NONE) {
    config->log_level = Y_LOG_LEVEL_ERROR;
  }
  
  if (config->log_mode == Y_LOG_MODE_FILE && config->log_file == NULL) {
    fprintf(stderr, "Error, you must specify a log file if log mode is set to file\n");
    print_help(stderr);
    return 0;
  }
  
  return 1;
}

/**
 * Return the filename extension
 */
const char * get_filename_ext(const char *path) {
    const char *dot = strrchr(path, '.');
    if(!dot || dot == path) return "*";
    if (strchr(dot, '?') != NULL) {
      *strchr(dot, '?') = '\0';
    }
    return dot;
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
