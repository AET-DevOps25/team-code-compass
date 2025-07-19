#!/bin/bash

# Register a new user

if [ $# -lt 3 ]; then
    echo "Usage: $0 <username> <email> <password>"
    echo "Example: $0 testuser test@example.com Password123"
    exit 1
fi

USERNAME=$1
EMAIL=$2
PASSWORD=$3

echo "Registering user: $USERNAME"

RESPONSE=$(curl -s -X POST http://localhost:8080/user-service/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$USERNAME"'",
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "heightCm": 180,
    "weightKg": 75
  }')

echo "Response:"
echo "$RESPONSE" | jq

# Extract user ID
USER_ID=$(echo "$RESPONSE" | jq -r '.id')
if [ "$USER_ID" != "null" ]; then
    echo ""
    echo "User registered successfully!"
    echo "User ID: $USER_ID"
else
    echo ""
    echo "Registration failed!"
fi