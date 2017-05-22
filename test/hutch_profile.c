/* Public domain, no copyright. Use at your own risk. */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <time.h>

#include <check.h>
#include <ulfius.h>
#include <orcania.h>
#include <yder.h>

#include "unit-tests.h"

#define AUTH_SERVER_URI "http://localhost:4593/glewlwyd"
#define USER_LOGIN "user1"
#define USER_PASSWORD "MyUser1Password!"
#define USER_SCOPE_LIST "hutch"
#define HUTCH_SERVER_URI "http://localhost:4884/api"

struct _u_request user_req;

START_TEST(test_hutch_profile_set)
{
  char * url = msprintf("%s/profile/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssss}", "fortune", "fortune_test", "picture", "picture_test");
  
  int res = run_simple_test(&user_req, "PUT", url, NULL, NULL, j_body, NULL, 200, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_profile_set_error)
{
  char * url = msprintf("%s/profile/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{sisi}", "fortune", 0, "picture", 42);
  
  int res = run_simple_test(&user_req, "PUT", url, NULL, NULL, j_body, NULL, 400, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_profile_get)
{
  char * url = msprintf("%s/profile/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssss}", "fortune", "fortune_test", "picture", "picture_test");
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, j_body, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_profile_get_history)
{
  char * url = msprintf("%s/profile/history", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

static Suite *libjwt_suite(void)
{
	Suite *s;
	TCase *tc_core;

	s = suite_create("Hutch profile management");
	tc_core = tcase_create("test_hutch_profile");
	tcase_add_test(tc_core, test_hutch_profile_set);
	tcase_add_test(tc_core, test_hutch_profile_set_error);
	tcase_add_test(tc_core, test_hutch_profile_get);
	tcase_add_test(tc_core, test_hutch_profile_get_history);
	tcase_set_timeout(tc_core, 30);
	suite_add_tcase(s, tc_core);

	return s;
}

int main(int argc, char *argv[])
{
  int number_failed;
  Suite *s;
  SRunner *sr;
  struct _u_request auth_req;
  struct _u_response auth_resp;
  int res;
  
  y_init_logs("Hutch test", Y_LOG_MODE_CONSOLE, Y_LOG_LEVEL_DEBUG, NULL, "Starting Hutch profile test");
  
  // Getting a refresh_token
  ulfius_init_request(&auth_req);
  ulfius_init_request(&user_req);
  ulfius_init_response(&auth_resp);
  auth_req.http_verb = strdup("POST");
  auth_req.http_url = msprintf("%s/token/", argc>4?argv[4]:AUTH_SERVER_URI);
  u_map_put(auth_req.map_post_body, "grant_type", "password");
  u_map_put(auth_req.map_post_body, "username", argc>1?argv[1]:USER_LOGIN);
  u_map_put(auth_req.map_post_body, "password", argc>2?argv[2]:USER_PASSWORD);
  u_map_put(auth_req.map_post_body, "scope", argc>3?argv[3]:USER_SCOPE_LIST);
  res = ulfius_send_http_request(&auth_req, &auth_resp);
  if (res == U_OK && auth_resp.status == 200) {
    json_t * json_body = ulfius_get_json_body_response(&auth_resp, NULL);
    char * bearer_token = msprintf("Bearer %s", (json_string_value(json_object_get(json_body, "access_token"))));
    y_log_message(Y_LOG_LEVEL_INFO, "User %s authenticated", USER_LOGIN, json_dumps(json_body, JSON_ENCODE_ANY), auth_resp.status);
    u_map_put(user_req.map_header, "Authorization", bearer_token);
    free(bearer_token);
    json_decref(json_body);
    
    s = libjwt_suite();
    sr = srunner_create(s);

    srunner_run_all(sr, CK_VERBOSE);
    number_failed = srunner_ntests_failed(sr);
    srunner_free(sr);
  
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error authentication user %s", USER_LOGIN);
  }
  ulfius_clean_request(&auth_req);
  ulfius_clean_response(&auth_resp);
  
  ulfius_clean_request(&user_req);
  
  y_close_logs();
  
	return (number_failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
