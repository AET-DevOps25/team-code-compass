#!/bin/bash

# Login user and save credentials

if [ $# -lt 2 ]; then
    echo "Usage: $0 <email> <password>"
    echo "Example: $0 test@example.com Password123"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "Logging in user: $EMAIL"

RESPONSE=$(curl -s -X POST http://localhost:8080/user-service/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')

echo "Response:"
echo "$RESPONSE" | jq

# Extract JWT token and user ID
JWT_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')

if [ "$JWT_TOKEN" != "null" ]; then
    echo ""
    echo "Login successful!"
    echo "JWT Token: $JWT_TOKEN"
    echo "User ID: $USER_ID"
    
    # Save to credentials file
    cat > ./scripts/set-credentials.sh << EOF
#!/bin/bash

# Set JWT token and user ID for testing
export JWT_TOKEN="$JWT_TOKEN"
export USER_ID="$USER_ID"

echo "JWT_TOKEN and USER_ID have been set"
echo "USER_ID: \$USER_ID"
EOF
    
    echo ""
    echo "Credentials saved to ./scripts/set-credentials.sh"
    echo "Run 'source ./scripts/set-credentials.sh' to load credentials"
else
    echo ""
    echo "Login failed!"
fi