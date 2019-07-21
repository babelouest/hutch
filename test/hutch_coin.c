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

START_TEST(test_hutch_safe_add)
{
  char * url = msprintf("%s/safe/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssssss}", "name", "safe_test", "description", "description for safe_test", "key", "key for safe_test");
  
  int res = run_simple_test(&user_req, "POST", url, NULL, NULL, j_body, NULL, 200, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_list)
{
  char * url = msprintf("%s/safe/safe_test/coin/", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_add_valid)
{
  char * url = msprintf("%s/safe/safe_test/coin/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssss}", "name", "coin_test", "data", "data for coin_test");
  
  int res = run_simple_test(&user_req, "POST", url, NULL, NULL, j_body, NULL, 200, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_add_invalid)
{
  char * url = msprintf("%s/safe/safe_test/coin/", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{siss}", "name", 42, "data", "data for 42");
  
  int res = run_simple_test(&user_req, "POST", url, NULL, NULL, j_body, NULL, 400, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_new)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssss}", "name", "coin_test", "data", "data for coin_test");
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, j_body, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_not_exist)
{
  char * url = msprintf("%s/safe/safe_test/coin/not_exist", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 404, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_set_valid)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ss}", "data", "new data for coin_test");
  
  int res = run_simple_test(&user_req, "PUT", url, NULL, NULL, j_body, NULL, 200, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_new_new)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ssss}", "name", "coin_test", "data", "new data for coin_test");
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, j_body, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_set_invalid_data)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{si}", "data", 42);
  
  int res = run_simple_test(&user_req, "PUT", url, NULL, NULL, j_body, NULL, 400, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_set_not_exist)
{
  char * url = msprintf("%s/safe/safe_test/coin/not_exist", HUTCH_SERVER_URI);
  json_t * j_body = json_pack("{ss}", "data", "new data for coin_test");
  
  int res = run_simple_test(&user_req, "PUT", url, NULL, NULL, j_body, NULL, 404, NULL, NULL, NULL);
  free(url);
  json_decref(j_body);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_history)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test/history", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 200, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_delete_not_exist)
{
  char * url = msprintf("%s/safe/safe_test/coin/not_exist", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "DELETE", url, NULL, NULL, NULL, NULL, 404, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_delete_valid)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "DELETE", url, NULL, NULL, NULL, NULL, 200, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_delete_not_exist_anymore)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "DELETE", url, NULL, NULL, NULL, NULL, 404, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_coin_get_not_exist_anymore)
{
  char * url = msprintf("%s/safe/safe_test/coin/coin_test", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "GET", url, NULL, NULL, NULL, NULL, 404, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

START_TEST(test_hutch_safe_delete)
{
  char * url = msprintf("%s/safe/safe_test", HUTCH_SERVER_URI);
  
  int res = run_simple_test(&user_req, "DELETE", url, NULL, NULL, NULL, NULL, 200, NULL, NULL, NULL);
  free(url);
	ck_assert_int_eq(res, 1);
}
END_TEST

static Suite *hutch_suite(void)
{
	Suite *s;
	TCase *tc_core;

	s = suite_create("Hutch coin management");
	tc_core = tcase_create("test_hutch_coin");
	tcase_add_test(tc_core, test_hutch_profile_set);
	tcase_add_test(tc_core, test_hutch_safe_add);
	tcase_add_test(tc_core, test_hutch_coin_get_list);
	tcase_add_test(tc_core, test_hutch_coin_add_valid);
	tcase_add_test(tc_core, test_hutch_coin_add_invalid);
	tcase_add_test(tc_core, test_hutch_coin_get_new);
	tcase_add_test(tc_core, test_hutch_coin_get_not_exist);
	tcase_add_test(tc_core, test_hutch_coin_set_valid);
	tcase_add_test(tc_core, test_hutch_coin_get_new_new);
	tcase_add_test(tc_core, test_hutch_coin_set_invalid_data);
	tcase_add_test(tc_core, test_hutch_coin_set_not_exist);
	tcase_add_test(tc_core, test_hutch_coin_get_history);
	tcase_add_test(tc_core, test_hutch_coin_delete_not_exist);
	tcase_add_test(tc_core, test_hutch_coin_delete_valid);
	tcase_add_test(tc_core, test_hutch_coin_delete_not_exist_anymore);
	tcase_add_test(tc_core, test_hutch_coin_get_not_exist_anymore);
	tcase_add_test(tc_core, test_hutch_safe_delete);
	tcase_set_timeout(tc_core, 30);
	suite_add_tcase(s, tc_core);

	return s;
}

int main(int argc, char *argv[])
{
  int number_failed;
  Suite *s;
  SRunner *sr;
	char * bearer_token;
  
  y_init_logs("Hutch test", Y_LOG_MODE_CONSOLE, Y_LOG_LEVEL_DEBUG, NULL, "Starting Hutch test");
  
  ulfius_init_request(&user_req);
  bearer_token = msprintf("Bearer %s", argc>1?argv[1]:"error");
  u_map_put(user_req.map_header, "Authorization", bearer_token);
  free(bearer_token);
  
  s = hutch_suite();
  sr = srunner_create(s);

  srunner_run_all(sr, CK_VERBOSE);
  number_failed = srunner_ntests_failed(sr);
  srunner_free(sr);
  
  ulfius_clean_request(&user_req);
  
  y_close_logs();
  
	return (number_failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
