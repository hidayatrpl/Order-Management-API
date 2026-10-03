#!/bin/bash
BASE=http://localhost:3000
FAIL=0
TOKEN=""

# req METHOD PATH BODY STATUS_HARAPAN [TEKS_YANG_HARUS_ADA]
req() {
  local code
  code=$(curl -s -o /tmp/res.json -w "%{http_code}" \
    ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
    -X "$1" "$BASE$2" -H "Content-Type: application/json" ${3:+-d "$3"})

  if [ "$code" != "$4" ]; then
    echo "FAIL [$code] $1 $2 (harapan: $4)"; cat /tmp/res.json; echo
    FAIL=$((FAIL+1)); return
  fi
  if [ "$code" != "204" ] && [ "$(head -c1 /tmp/res.json)" != "{" ]; then
    echo "FAIL [$code] $1 $2 -> response bukan JSON"
    FAIL=$((FAIL+1)); return
  fi
  if [ -n "$5" ] && ! grep -qF "$5" /tmp/res.json; then
    echo "FAIL [$code] $1 $2 -> pesan tidak memuat: $5"; cat /tmp/res.json; echo
    FAIL=$((FAIL+1)); return
  fi
  echo "PASS [$code] $1 $2"
}
last_id() { grep -o '"id":[0-9]*' /tmp/res.json | head -1 | cut -d: -f2; }

echo "== SETUP =="
ADMIN_EMAIL=${ADMIN_EMAIL:-"[EMAIL_ADDRESS]"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"rahasia123"}

req POST /auth/login "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 200
TOKEN=$(grep -o '"token":"[^"]*"' /tmp/res.json | head -1 | cut -d'"' -f4)
[ -z "$TOKEN" ] && { echo "SETUP GAGAL: login gagal"; exit 1; }

req POST /categories '{"name":"Audio-'$RANDOM'"}' 201
CAT=$(last_id)
req POST /categories '{"name":"Temp-'$RANDOM'"}' 201
TMP=$(last_id)
[ -z "$CAT" ] && { echo "SETUP GAGAL: kategori tidak terbuat"; exit 1; }

echo "== PRODUCTS: BERHASIL =="
req POST /products '{"name":"Mouse","price":150000,"stock":10,"category_id":'$CAT'}' 201
PROD=$(last_id)
[ -z "$PROD" ] && { echo "SETUP GAGAL: produk tidak terbuat"; exit 1; }
req GET /products "" 200
req GET /products/$PROD "" 200

echo "== VALIDASI =="
req POST /products '{"price":1000,"stock":1,"category_id":'$CAT'}' 400
req POST /products '{"name":"","price":1000,"stock":1,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","stock":1,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","price":-5,"stock":1,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","price":"abc","stock":1,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","price":1000,"stock":-1,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","price":1000,"stock":1.5,"category_id":'$CAT'}' 400
req POST /products '{"name":"Tes","price":1000,"stock":1}' 400
req POST /products '{"name":"Tes","price":1000,"stock":1,"category_id":999999}' 409 "tidak ditemukan"

echo "== BATAS NILAI (kategori masih ada) =="
req POST /products '{"name":"Stok Habis","price":1000,"stock":0,"category_id":'$CAT'}' 201
Z=$(last_id)
req POST /products '{"name":"Gratis","price":0,"stock":1,"category_id":'$CAT'}' 201
G=$(last_id)

echo "== ID BERMASALAH =="
req GET /products/999999 "" 404
req GET /products/abc "" 400
req PUT /products/999999 '{"name":"X","price":1000,"stock":1,"category_id":'$CAT'}' 404
req DELETE /products/999999 "" 404

echo "== UPDATE (PUT = ganti penuh) =="
req PUT /products/$PROD '{"name":"Mouse Pro","price":175000,"stock":20,"category_id":'$CAT'}' 200
req GET /products/$PROD "" 200 "Mouse Pro"

echo "== KEAMANAN DASAR =="
req POST /products '{"name":"x'"'"'; DROP TABLE products;--","price":1000,"stock":1,"category_id":'$CAT'}' 201
INJ=$(last_id)
req GET /products "" 200 "DROP TABLE"

echo "== FORMAT ERROR =="
req GET /route-ngawur "" 404
req PATCH /products/$PROD '{"stock":5}' 404     
req POST /products '{rusak' 400 "bukan JSON"

echo "== RELASI & DELETE =="
req DELETE /categories/$CAT "" 409 "masih dipakai"
req DELETE /categories/$TMP "" 204
req DELETE /categories/$TMP "" 404

echo "== CLEANUP =="
for id in $PROD $INJ $Z $G; do req DELETE /products/$id "" 204; done
req DELETE /products/$PROD "" 404
req DELETE /categories/$CAT "" 204

echo
echo "Total gagal: $FAIL"
[ "$FAIL" -eq 0 ] && echo "SEMUA LOLOS" || exit 1