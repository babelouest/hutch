/* Public domain, no copyright. Use at your own risk. */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <time.h>

#include <check.h>
#include <orcania.h>
#include <yder.h>
#include <ulfius.h>
#include <rhonabwy.h>

#include "unit-tests.h"

#define USER_LOGIN       "dev"
#define HUTCH_SERVER_URI "http://localhost:4884/"
#define HUTCH_SERVER_API HUTCH_SERVER_URI "api"

#define PROFILE_NAME "myProfile"
#define PROFILE_FORTUNE "myFortune"
#define PROFILE_PICTURE "myPicture"

#define SAFE_NAME "safe"
#define SAFE_DISPLAY_NAME "My safe"
#define SAFE_ENC_TYPE "My safe enc type"

#define COIN_NAME "coin"
#define COIN_DATA "My coin data"

struct _u_request user_req;
jwks_t * jwks_config;

struct _u_request user_req, admin_req;
char * user_login = NULL, * admin_login = NULL, * data_source_path;

START_TEST(test_add_safe)
{
  json_t * j_profile, * j_safe;
  jwk_t * jwk = r_jwks_get_at(jwks_config, 0);
  const char * kid = r_jwk_get_property_str(jwk, "kid");
  
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/", NULL, 403, NULL, NULL, NULL), 1);
  j_profile = json_pack("{ssssssss*}",
                        "name", PROFILE_NAME,
                        "fortune", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE,
                        "sign_kid", kid);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 200, NULL, NULL, NULL), 1);
  r_jwk_free(jwk);
  j_safe = json_pack("{ssssss}",
                     "name", SAFE_NAME,
                     "display_name", SAFE_DISPLAY_NAME,
                     "enc_type", SAFE_ENC_TYPE);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/", j_safe, 200, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  json_decref(j_safe);
}
END_TEST

START_TEST(test_delete_safe)
{
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/profile/", NULL, 200, NULL, NULL, NULL), 1);
}
END_TEST

START_TEST(test_add_coin_error)
{
  json_t * j_coin;
  char big_str[] = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
  
  j_coin = json_pack("{sisi}",
                     "name", 42,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 400, NULL, NULL, NULL), 1);
  json_decref(j_coin);

  j_coin = json_pack("{sssi}",
                     "name", COIN_NAME,
                     "data", 42);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 400, NULL, NULL, NULL), 1);
  json_decref(j_coin);

  j_coin = json_pack("{ssss}",
                     "name", big_str,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 400, NULL, NULL, NULL), 1);
  json_decref(j_coin);

  j_coin = json_pack("{ssss}",
                     "name", COIN_NAME,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 400, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
  json_decref(j_coin);
}
END_TEST

START_TEST(test_add_coin_ok)
{
  json_t * j_coin, * j_result = json_object();
  
  j_coin = json_pack("{ssss}",
                     "name", COIN_NAME,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/"  SAFE_NAME "/coin/" COIN_NAME, NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/"  SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
  json_decref(j_coin);
  json_decref(j_result);
}
END_TEST

START_TEST(test_set_coin_error)
{
  json_t * j_coin;
  
  j_coin = json_pack("{ssss}",
                     "name", COIN_NAME,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
  json_decref(j_coin);
  
  j_coin = json_pack("{si}", "data", 42);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, j_coin, 400, NULL, NULL, NULL), 1);
  json_decref(j_coin);

	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
}
END_TEST

START_TEST(test_set_coin_ok)
{
  json_t * j_coin, * j_result = json_object();
  
  j_coin = json_pack("{ssss}",
                     "name", COIN_NAME,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
  json_decref(j_coin);
  
  j_coin = json_pack("{ss}",
                     "data", COIN_DATA "-updated");
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, j_coin, 200, NULL, NULL, NULL), 1);

	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
  json_decref(j_coin);
  json_decref(j_result);
}
END_TEST

START_TEST(test_delete_coin_ok)
{
  json_t * j_coin;
  
  j_coin = json_pack("{ssss}",
                     "name", COIN_NAME,
                     "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 404, NULL, NULL, NULL), 1);
  json_decref(j_coin);
}
END_TEST

static Suite *hutch_suite(void)
{
	Suite *s;
	TCase *tc_core;

	s = suite_create("Hutch secret vault test");
	tc_core = tcase_create("test_coin");
	tcase_add_test(tc_core, test_add_safe);
	tcase_add_test(tc_core, test_add_coin_error);
	tcase_add_test(tc_core, test_add_coin_ok);
	tcase_add_test(tc_core, test_set_coin_error);
	tcase_add_test(tc_core, test_set_coin_ok);
	tcase_add_test(tc_core, test_delete_coin_ok);
	tcase_add_test(tc_core, test_delete_safe);
	
	tcase_set_timeout(tc_core, 30);
	suite_add_tcase(s, tc_core);

	return s;
}

int main(int argc, char *argv[])
{
  int number_failed = 0;
  Suite *s;
  SRunner *sr;
  jwt_t * jwt;
  jwks_t * jwks;
  char * str_jwks, * token, * bearer_token;
  json_t * j_claims;
  time_t now;
  
  y_init_logs("Hutch test", Y_LOG_MODE_CONSOLE, Y_LOG_LEVEL_DEBUG, NULL, "Starting Hutch test");
  
  if (argv[1] != NULL) {
    str_jwks = read_file(argv[1]);
    
    // Generate user and admin access tokens
    ulfius_init_request(&user_req);
    r_jwt_init(&jwt);
    r_jwt_set_header_str_value(jwt, "typ", "at+jwt");
    r_jwks_init(&jwks);
    r_jwks_import_from_str(jwks, str_jwks);
    r_jwt_add_sign_jwks(jwt, jwks, NULL);
    o_free(str_jwks);
    
    time(&now);
    j_claims = json_pack("{ss ss ss ss ss si si si ss}",
                         "iss", "https://glewlwyd.tld/",
                         "sub", USER_LOGIN,
                         "client_id", "client",
                         "jti", "abcdxyz1234",
                         "type", "access_token",
                         "iat", now,
                         "exp", now+3600,
                         "nbf", now,
                         "scope", "hutch");
    r_jwt_set_full_claims_json_t(jwt, j_claims);
    token = r_jwt_serialize_signed(jwt, NULL, 0);
    bearer_token = msprintf("Bearer %s", token);
    u_map_put(user_req.map_header, "Authorization", bearer_token);
    o_free(bearer_token);
    o_free(token);
    
    json_decref(j_claims);
    r_jwt_free(jwt);
    r_jwks_free(jwks);
    
    r_jwks_init(&jwks_config);
    r_jwks_import_from_uri(jwks_config, HUTCH_SERVER_URI "/jwks", 0);
    
    s = hutch_suite();
    sr = srunner_create(s);

    srunner_run_all(sr, CK_VERBOSE);
    number_failed = srunner_ntests_failed(sr);
    srunner_free(sr);
    
    ulfius_clean_request(&user_req);
    r_jwks_free(jwks_config);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error, no jwks file path specified");
    number_failed = 1;
  }
  
  y_close_logs();
  
	return (number_failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
