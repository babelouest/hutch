/* Public domain, no copyright. Use at your own risk. */

#include <ulfius.h>

char * print_map(const struct _u_map * map);
void print_response(struct _u_response * response);
int test_request(struct _u_request * req, long int expected_status, json_t * expected_json_body, jwks_t * jwks, json_t * j_result);
int run_simple_authenticated_test(struct _u_request * req, const char * method, const char * url, json_t * json_body, int expected_status, json_t * expected_json_body, jwks_t * jwks, json_t * j_result);
char * url_decode(const char * str);
char * url_encode(const char * str);
json_t * json_search(json_t * haystack, json_t * needle);
char * read_file(const char * filename);
int is_around_now_timestamp(time_t timestamp);
