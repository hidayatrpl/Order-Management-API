#!/bin/bash
# Pakai: ADMIN_EMAIL=... ADMIN_PASSWORD=... bash test-tahap2.sh
BASE=http://localhost:3000
FAIL=0
TOKEN=""

: "${ADMIN_EMAIL:?isi ADMIN_EMAIL}"
: "${ADMIN_PASSWORD:?isi ADMIN_PASSWORD}"

req() {  # req METHOD PATH BODY STATUS [TEKS_YANG_HARUS_ADA]
  local code args=(-s -o /tmp/res.json -w "%{http_code}" -X "$1" "$BASE$2" -H "Content-Type: application/json")
  [ -n "$TOKEN" ] && args+=(-H "Authorization: Bearer $TOKEN")
  [ -n "$3" ] && args+=(-d "$3")
  code=$(curl "${args[@]}")

  if [ "$code" != "$4" ]; then
    echo "FAIL [$code] $1 $2 (harapan: $4)"; cat /tmp/res.json; echo; FAIL=$((FAIL+1)); return
  fi
  if [ "$code" != "204" ] && [ "$(head -c1 /tmp/res.json)" != "{" ]; then
    echo "FAIL [$code] $1 $2 -> bukan JSON"; FAIL=$((FAIL+1)); return
  fi
  if [ -n "$5" ] && ! grep -qF "$5" /tmp/res.json; then
    echo "FAIL [$code] $1 $2 -> pesan tidak memuat: $5"; cat /tmp/res.json; echo; FAIL=$((FAIL+1)); return
  fi
  echo "PASS [$code] $1 $2"
}
absent() {
  if grep -qi "$1" /tmp/res.json; then echo "FAIL response memuat '$1'"; FAIL=$((FAIL+1))
  else echo "PASS response tidak memuat '$1'"; fi
}
last_id()   { grep -o '"id":[0-9]*' /tmp/res.json | head -1 | cut -d: -f2; }
get_token() { grep -o '"token":"[^"]*"' /tmp/res.json | head -1 | cut -d'"' -f4; }

EMAIL="cust$RANDOM@test.com"
PASS="Password123"

echo "== REGISTER =="
req POST /auth/register '{"name":"Budi","password":"'$PASS'"}' 400
req POST /auth/register '{"name":"Budi","email":"bukan-email","password":"'$PASS'"}' 400
req POST /auth/register '{"name":"Budi","email":"'$EMAIL'","password":"123"}' 400
req POST /auth/register '{"name":"Budi","email":"'$EMAIL'","password":"'$PASS'"}' 201
absent password
req POST /auth/register '{"name":"Budi","email":"'$EMAIL'","password":"'$PASS'"}' 409
req POST /auth/register '{"name":"Budi","email":"'${EMAIL^^}'","password":"'$PASS'"}' 409

echo "== LOGIN =="
req POST /auth/login '{"email":"'$EMAIL'","password":"salah-total"}' 401 "Email atau password salah"
req POST /auth/login '{"email":"tidakada'$RANDOM'@test.com","password":"'$PASS'"}' 401 "Email atau password salah"
req POST /auth/login '{"email":"'$EMAIL'"}' 400
req POST /auth/login '{"email":"'$EMAIL'","password":"'$PASS'"}' 200
absent password
CUST_TOKEN=$(get_token)
[ -z "$CUST_TOKEN" ] && { echo "SETUP GAGAL: token customer kosong (cek nama field token)"; exit 1; }
req POST /auth/login '{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASSWORD'"}' 200
ADMIN_TOKEN=$(get_token)
[ -z "$ADMIN_TOKEN" ] && { echo "SETUP GAGAL: login admin gagal (sudah npm run seed:admin?)"; exit 1; }

echo "== /auth/me =="
TOKEN="";            req GET /auth/me "" 401
TOKEN="abc.def.ghi"; req GET /auth/me "" 401
TOKEN=$CUST_TOKEN;   req GET /auth/me "" 200 "$EMAIL"
absent password
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/auth/me -H "Authorization: Token $CUST_TOKEN")
[ "$code" = "401" ] && echo "PASS [401] header bukan 'Bearer'" || { echo "FAIL header salah skema -> $code"; FAIL=$((FAIL+1)); }

echo "== AKSES PUBLIK TETAP TERBUKA =="
TOKEN=""; req GET /products "" 200
TOKEN=""; req GET /categories "" 200

echo "== OTORISASI CATEGORIES =="
TOKEN="";            req POST /categories '{"name":"X-'$RANDOM'"}' 401
TOKEN=$CUST_TOKEN;   req POST /categories '{"name":"X-'$RANDOM'"}' 403
TOKEN=$ADMIN_TOKEN;  req POST /categories '{"name":"Cat-'$RANDOM'"}' 201
CAT=$(last_id)

echo "== OTORISASI PRODUCTS =="
BODY='{"name":"Mouse","price":150000,"stock":10,"category_id":'$CAT'}'
TOKEN="";            req POST /products "$BODY" 401
TOKEN=$CUST_TOKEN;   req POST /products "$BODY" 403
TOKEN=$ADMIN_TOKEN;  req POST /products "$BODY" 201
PROD=$(last_id)
[ -z "$PROD" ] && { echo "SETUP GAGAL: admin tidak bisa membuat produk"; exit 1; }

TOKEN=$CUST_TOKEN
req PUT /products/$PROD "$BODY" 403
req DELETE /products/$PROD "" 403
req DELETE /categories/$CAT "" 403

TOKEN=$ADMIN_TOKEN
req PUT /products/$PROD '{"name":"Mouse Pro","price":175000,"stock":20,"category_id":'$CAT'}' 200

echo "== MASS ASSIGNMENT (role dari body harus diabaikan) =="
HEMAIL="hack$RANDOM@test.com"
TOKEN=""
req POST /auth/register '{"name":"Hacker","email":"'$HEMAIL'","password":"'$PASS'","role":"admin"}' 201
req POST /auth/login '{"email":"'$HEMAIL'","password":"'$PASS'"}' 200
TOKEN=$(get_token)
req POST /products "$BODY" 403

echo "== CLEANUP =="
TOKEN=$ADMIN_TOKEN
req DELETE /products/$PROD "" 204
req DELETE /categories/$CAT "" 204

echo
echo "Total gagal: $FAIL"
[ "$FAIL" -eq 0 ] && echo "SEMUA LOLOS" || exit 1