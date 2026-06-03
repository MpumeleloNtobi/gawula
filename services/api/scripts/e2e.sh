#!/usr/bin/env bash
set -euo pipefail
BASE=http://localhost:4000/v1
jqget() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1"; }

echo "== customer login =="
CUST=$(curl -s -X POST $BASE/auth/customer/login -H 'content-type: application/json' \
  -d '{"phone":"0820000001","code":"000000"}')
echo "$CUST" | head -c 300; echo
CUST_TOKEN=$(echo "$CUST" | jqget "d['token']")

echo "== fetch catalog (complex + outlets + items) =="
COMPLEXES=$(curl -s $BASE/complexes)
COMPLEX_ID=$(echo "$COMPLEXES" | jqget "d[0]['id']")
echo "complex: $COMPLEX_ID"
OUTLETS=$(curl -s "$BASE/complexes/$COMPLEX_ID/outlets")
OUTLET_ID=$(echo "$OUTLETS" | jqget "[o['id'] for o in d if o['id'].endswith(':ember')][0]")
MENU=$(curl -s "$BASE/outlets/$OUTLET_ID/menu")
ITEM_ID=$(echo "$MENU" | jqget "d['items'][0]['id']")
echo "outlet: $OUTLET_ID item: $ITEM_ID"

echo "== place order =="
ORDER=$(curl -s -X POST $BASE/orders -H "authorization: Bearer $CUST_TOKEN" -H 'content-type: application/json' \
  -d "{\"complexId\":\"$COMPLEX_ID\",\"tipCents\":1000,\"paymentMethod\":\"card\",\"lines\":[{\"outletId\":\"$OUTLET_ID\",\"itemId\":\"$ITEM_ID\",\"qty\":2}]}")
echo "$ORDER" | head -c 400; echo
ORDER_ID=$(echo "$ORDER" | jqget "d['id']")
SUBORDER_ID=$(echo "$ORDER" | jqget "d['subOrders'][0]['id']")
echo "order: $ORDER_ID suborder: $SUBORDER_ID"

echo "== confirm payment =="
curl -s -X POST $BASE/payments/$ORDER_ID/confirm -H "authorization: Bearer $CUST_TOKEN" | head -c 300; echo

echo "== partner login =="
PARTNER=$(curl -s -X POST $BASE/auth/staff/login -H 'content-type: application/json' \
  -d '{"email":"partner@qa.test","password":"qa-password"}')
PARTNER_TOKEN=$(echo "$PARTNER" | jqget "d['token']")
echo "partner suborders:"
curl -s $BASE/partner/suborders -H "authorization: Bearer $PARTNER_TOKEN" | head -c 300; echo

echo "== partner accept -> preparing -> ready =="
for STATUS in accepted preparing ready; do
  curl -s -X PATCH $BASE/partner/suborders/$SUBORDER_ID/status -H "authorization: Bearer $PARTNER_TOKEN" \
    -H 'content-type: application/json' -d "{\"status\":\"$STATUS\"}" | head -c 120; echo " <- $STATUS"
done

echo "== rider login =="
RIDER=$(curl -s -X POST $BASE/auth/rider/login -H 'content-type: application/json' \
  -d '{"phone":"0820000002","code":"000000"}')
RIDER_TOKEN=$(echo "$RIDER" | jqget "d['token']")
echo "available trips:"
AVAIL=$(curl -s $BASE/dispatch/trips/available -H "authorization: Bearer $RIDER_TOKEN")
echo "$AVAIL" | head -c 300; echo

echo "== rider claim =="
TRIP=$(curl -s -X POST $BASE/dispatch/trips/claim -H "authorization: Bearer $RIDER_TOKEN" \
  -H 'content-type: application/json' -d "{\"orderId\":\"$ORDER_ID\"}")
echo "$TRIP" | head -c 300; echo
TRIP_ID=$(echo "$TRIP" | jqget "d['tripId']")
echo "trip: $TRIP_ID"

echo "== rider pickup =="
curl -s -X POST $BASE/dispatch/trips/$TRIP_ID/pickup -H "authorization: Bearer $RIDER_TOKEN" \
  -H 'content-type: application/json' -d "{\"subOrderId\":\"$SUBORDER_ID\"}" | head -c 200; echo

echo "== rider deliver =="
curl -s -X POST $BASE/dispatch/trips/$TRIP_ID/deliver -H "authorization: Bearer $RIDER_TOKEN" | head -c 200; echo

echo "== customer track order =="
curl -s $BASE/orders/$ORDER_ID -H "authorization: Bearer $CUST_TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('status:',d['status'])"

echo "== customer notifications =="
curl -s $BASE/notifications -H "authorization: Bearer $CUST_TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);[print('-',e['message']) for e in d[:6]]"

echo "== admin overview =="
ADMIN=$(curl -s -X POST $BASE/auth/staff/login -H 'content-type: application/json' \
  -d '{"email":"admin@qa.test","password":"qa-password"}')
ADMIN_TOKEN=$(echo "$ADMIN" | jqget "d['token']")
curl -s $BASE/admin/overview -H "authorization: Bearer $ADMIN_TOKEN" | head -c 400; echo

echo "== E2E DONE =="
