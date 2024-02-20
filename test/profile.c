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

#define COIN_NAME "coin"
#define COIN_DATA "My coin data"

#define SAFE_KEY_NAME "key"
#define SAFE_KEY_DATA "My safe key data"

struct _u_request user_req;
jwks_t * jwks_config;

START_TEST(test_get_profile_empty)
{
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/profile/", NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(NULL, "GET", HUTCH_SERVER_API "/profile/", NULL, 401, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 404, NULL, NULL, NULL), 1);
}
END_TEST

START_TEST(test_set_profile_error)
{
  json_t * j_profile;
  char big_str[] = "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
  
  j_profile = json_pack("{sissss}",
                        "name", 42,
                        "message", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{sssiss}",
                        "name", PROFILE_NAME,
                        "message", 42,
                        "picture", PROFILE_PICTURE);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{sssssi}",
                        "name", PROFILE_NAME,
                        "message", PROFILE_FORTUNE,
                        "picture", 42);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{sssssssi}",
                        "name", PROFILE_NAME,
                        "message", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE,
                        "sign_kid", 42);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{ssssss}",
                        "name", big_str,
                        "message", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{ssssss}",
                        "name", PROFILE_NAME,
                        "message", big_str,
                        "picture", PROFILE_PICTURE);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
  
  j_profile = json_pack("{ssssssss}",
                        "name", PROFILE_NAME,
                        "message", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE,
                        "sign_kid", "error");
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 400, NULL, NULL, NULL), 1);
  json_decref(j_profile);
}
END_TEST

START_TEST(test_set_profile_ok)
{
  json_t * j_profile, * j_result = json_object();
  jwk_t * jwk = r_jwks_get_at(jwks_config, 0);
  const char * kid = r_jwk_get_property_str(jwk, "kid");
  
  j_profile = json_pack("{ssssssss*}",
                        "name", PROFILE_NAME,
                        "message", PROFILE_FORTUNE,
                        "picture", PROFILE_PICTURE,
                        "sign_kid", kid);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 404, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 200, j_profile, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_profile);
  
  j_profile = json_pack("{ssssssss*}",
                        "name", PROFILE_NAME "-updated",
                        "message", PROFILE_FORTUNE "-updated",
                        "picture", PROFILE_PICTURE "-updated",
                        "sign_kid", kid);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 200, j_profile, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_profile);
  json_decref(j_result);
  
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/profile/", NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 404, NULL, NULL, NULL), 1);
  r_jwk_free(jwk);
}
END_TEST

START_TEST(test_profile_minimal)
{
  json_t * j_profile, * j_safe, * j_safe_key, * j_coin, * j_result = json_object();
  
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/", NULL, 403, NULL, NULL, NULL), 1);
  j_profile = json_pack("{ss}", "name", PROFILE_NAME);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_profile, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 200, j_profile, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_object_clear(j_result);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/profile/", j_result, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/profile/", NULL, 200, NULL, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_profile);
  json_object_clear(j_result);
  
  j_safe = json_pack("{ss}", "name", SAFE_NAME);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/", j_safe, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME, NULL, 200, j_safe, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_object_clear(j_result);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/safe/" SAFE_NAME, j_result, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME, NULL, 200, j_safe, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_safe);
  json_object_clear(j_result);

  j_safe_key = json_pack("{ssss}", "name", SAFE_KEY_NAME, "data", SAFE_KEY_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/key/", j_safe_key, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/key/" SAFE_KEY_NAME, NULL, 200, j_safe_key, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_object_clear(j_result);
  json_object_del(j_safe_key, "name");
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/safe/" SAFE_NAME "/key/", j_safe_key, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/key/" SAFE_KEY_NAME, NULL, 200, j_safe_key, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_safe_key);
  json_object_clear(j_result);

  j_coin = json_pack("{ssss}", "name", COIN_NAME, "data", COIN_DATA);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "POST", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_object_clear(j_result);
  json_object_del(j_coin, "name");
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "PUT", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/", j_coin, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "GET", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, j_coin, jwks_config, j_result), 1);
  ck_assert_int_eq(1, is_around_now_timestamp((time_t)json_integer_value(json_object_get(j_result, "last_updated"))));
  json_decref(j_coin);
  json_decref(j_result);

	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/coin/" COIN_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME "/key/" SAFE_KEY_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/safe/" SAFE_NAME, NULL, 200, NULL, NULL, NULL), 1);
	ck_assert_int_eq(run_simple_authenticated_test(&user_req, "DELETE", HUTCH_SERVER_API "/profile/", NULL, 200, NULL, NULL, NULL), 1);
}
END_TEST

static Suite *hutch_suite(void)
{
	Suite *s;
	TCase *tc_core;

	s = suite_create("Hutch secret vault test");
	tc_core = tcase_create("test_profile");
	tcase_add_test(tc_core, test_get_profile_empty);
	tcase_add_test(tc_core, test_set_profile_error);
	tcase_add_test(tc_core, test_set_profile_ok);
	tcase_add_test(tc_core, test_profile_minimal);
	
	tcase_set_timeout(tc_core, 30);
	suite_add_tcase(s, tc_core);

	return s;
}

int main(int argc, char *argv[])
{
  int number_failed = 0;
  SRunner *sr;
  jwt_t * jwt, * jwt_jwks;
  jwks_t * jwks;
  char * str_jwks, * token, * bearer_token;
  json_t * j_claims, * j_jwks;
  time_t now;
  struct _u_request req;
  struct _u_response resp;
  
  y_init_logs("Hutch test", Y_LOG_MODE_CONSOLE, Y_LOG_LEVEL_DEBUG, NULL, "Starting Hutch test");
  
  if (argv[1] != NULL) {
    str_jwks = read_file(argv[1]);
    
    // Generate user and admin access tokens
    ulfius_init_request(&user_req);
    r_jwt_init(&jwt);
    r_jwt_set_header_str_value(jwt, "typ", "at+jwt");
    r_jwks_init(&jwks);
    r_jwks_import_from_json_str(jwks, str_jwks);
    r_jwt_add_sign_jwks(jwt, jwks, NULL);
    o_free(str_jwks);
    
    time(&now);
    j_claims = json_pack("{ss ss ss ss si si si ss}",
                         "iss", "https://glewlwyd.tld/",
                         "sub", USER_LOGIN,
                         "client_id", "client",
                         "jti", "abcdxyz1234",
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
    ulfius_init_request(&req);
    ulfius_init_response(&resp);
    ulfius_set_request_properties(&req, U_OPT_HTTP_URL, HUTCH_SERVER_URI "/jwks",
                                        U_OPT_HEADER_PARAMETER, "accept", "application/jwt",
                                        U_OPT_NONE);
    ulfius_send_http_request(&req, &resp);
    r_jwt_init(&jwt_jwks);
    r_jwt_parsen(jwt_jwks, (const char *)resp.binary_body, resp.binary_body_length, 0);
    j_jwks = r_jwt_get_full_claims_json_t(jwt_jwks);
    r_jwks_import_from_json_t(jwks_config, j_jwks);
    r_jwt_add_sign_jwks(jwt_jwks, NULL, jwks_config);
    if (r_jwt_verify_signature(jwt_jwks, NULL, 0) != RHN_OK) {
      y_log_message(Y_LOG_LEVEL_ERROR, "Error, invalid jwks endpoint signature");
      number_failed = 1;
    }
    r_jwt_free(jwt_jwks);
    json_decref(j_jwks);
    ulfius_clean_request(&req);
    ulfius_clean_response(&resp);
    
    if (!number_failed) {
      sr = srunner_create(hutch_suite());

      srunner_run_all(sr, CK_VERBOSE);
      number_failed = srunner_ntests_failed(sr);
      srunner_free(sr);
    }
    
    ulfius_clean_request(&user_req);
    r_jwks_free(jwks_config);
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "Error, no jwks file path specified");
    number_failed = 1;
  }
  
  y_close_logs();
  
	return (number_failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
