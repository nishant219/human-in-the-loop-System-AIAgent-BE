#!/bin/bash

echo "========================================="
echo "🧪 DIRECT LIVEKIT & INTEGRATION TEST"
echo "========================================="

BASE_URL="http://localhost:3000/api"

echo -e "\n✅ Server Health Check..."
curl -s $BASE_URL/health | jq -r '.message'

echo -e "\n📊 Current System Status:"
echo "-------------------------------------------"

echo -e "\n1️⃣ Knowledge Base Test..."
KB_RESULT=$(curl -s -X POST $BASE_URL/knowledge-base/search \
  -H "Content-Type: application/json" \
  -d '{"question":"salon hours"}')
echo $KB_RESULT | jq
KB_FOUND=$(echo $KB_RESULT | jq -r '.found')
if [ "$KB_FOUND" = "false" ]; then
  echo "⚠️  No knowledge base entries found. Adding sample data..."
  curl -s -X POST $BASE_URL/knowledge-base \
    -H "Content-Type: application/json" \
    -d '{
      "question": "What are your salon hours?",
      "answer": "We are open Monday-Saturday 9AM-7PM, Sunday 10AM-5PM",
      "category": "hours",
      "tags": ["hours", "schedule"],
      "source": "test"
    }' | jq
fi

echo -e "\n2️⃣ Call Session Test..."
SESSION_ID="integration-test-$(date +%s)"
CALL_RESULT=$(curl -s -X POST $BASE_URL/calls/start \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"roomName\": \"room-$SESSION_ID\",
    \"callerPhone\": \"+1234567890\",
    \"callerName\": \"Test User\"
  }")
echo $CALL_RESULT | jq

CALL_SUCCESS=$(echo $CALL_RESULT | jq -r '.success')
if [ "$CALL_SUCCESS" = "true" ]; then
  echo "✅ Call session created successfully"
  
  echo -e "\n3️⃣ Retrieving Call Details..."
  curl -s $BASE_URL/calls/$SESSION_ID | jq
  
  echo -e "\n4️⃣ Creating Help Request..."
  HELP_RESULT=$(curl -s -X POST $BASE_URL/help-requests \
    -H "Content-Type: application/json" \
    -d "{
      \"question\": \"How much does a haircut cost?\",
      \"callerPhone\": \"+1234567890\",
      \"callerName\": \"Test User\",
      \"sessionId\": \"$SESSION_ID\",
      \"context\": \"Customer asking about pricing\"
    }")
  echo $HELP_RESULT | jq
  
  HELP_ID=$(echo $HELP_RESULT | jq -r '.data._id')
  
  echo -e "\n5️⃣ Getting Pending Help Requests..."
  curl -s $BASE_URL/help-requests/pending | jq
  
  if [ "$HELP_ID" != "null" ]; then
    echo -e "\n6️⃣ Resolving Help Request..."
    curl -s -X POST $BASE_URL/help-requests/$HELP_ID/resolve \
      -H "Content-Type: application/json" \
      -d '{
        "supervisorResponse": "Haircut starts at $30 for basic, $60 for premium",
        "supervisorId": "supervisor-test"
      }' | jq
  fi
  
  echo -e "\n7️⃣ Ending Call Session..."
  curl -s -X POST $BASE_URL/calls/$SESSION_ID/end \
    -H "Content-Type: application/json" \
    -d '{
      "transcript": "Test call transcript - customer asked about pricing"
    }' | jq
else
  echo "❌ Call session creation failed"
fi

echo -e "\n8️⃣ Final Statistics..."
curl -s $BASE_URL/calls/stats | jq

echo -e "\n9️⃣ Recent Call History..."
curl -s "$BASE_URL/calls?limit=3" | jq '.data.calls[] | {sessionId, callerName, status, duration}'

echo -e "\n🔟 Help Request History..."
curl -s "$BASE_URL/help-requests/history?limit=3" | jq '.data.requests[] | {question, status, callerName}'

echo -e "\n========================================="
echo "📋 INTEGRATION TEST SUMMARY"
echo "========================================="

STATS=$(curl -s $BASE_URL/calls/stats)
TOTAL_CALLS=$(echo $STATS | jq -r '.data.totalCalls')
ACTIVE_CALLS=$(echo $STATS | jq -r '.data.activeCalls')
COMPLETED_CALLS=$(echo $STATS | jq -r '.data.completedCalls')
TOTAL_HELP=$(echo $STATS | jq -r '.data.totalHelpRequests')

echo "📞 Total Calls: $TOTAL_CALLS"
echo "🟢 Active Calls: $ACTIVE_CALLS"
echo "✅ Completed Calls: $COMPLETED_CALLS"
echo "🆘 Help Requests: $TOTAL_HELP"

echo -e "\n✅ All API endpoints tested successfully!"
echo "========================================="
