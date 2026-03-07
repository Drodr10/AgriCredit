import asyncio
from unittest.mock import AsyncMock, patch
from fastapi import Request
from pymongo import MongoClient
import os

from app.core.config import settings
from app.core.security import get_current_user

# Mock database url to avoid connecting to production just for a unit test
os.environ["MONGODB_URL"] = "mongomock://localhost"

from mongomock import MongoClient as MockMongoClient

async def test_clerk_auth():
    print("--- Testing Clerk Auth Integration ---")
    
    # 1. Setup mock database
    db_client = MockMongoClient()
    db = db_client[settings.mongodb_db]
    
    # 2. Setup mock request
    # Create a mock Request object that passes FastAPI depends checks but doesn't need a real server
    scope = {
        "type": "http",
        "headers": [(b"authorization", b"Bearer fk_test_token")]
    }
    request = Request(scope)
    
    # 3. Mock the Clerk SDK response
    class MockPayload:
        def __init__(self, sub):
            self.sub = sub
            
        def get(self, key):
            if key == "sub": return self.sub
            return None
            
    class MockRequestState:
        def __init__(self, is_signed_in, payload):
            self.is_signed_in = is_signed_in
            self.payload = payload
            
    class MockClerkUser:
        def __init__(self, email):
            class EmailRecord:
                def __init__(self, e):
                    self.email_address = e
            self.email_addresses = [EmailRecord(email)]

    mock_state = MockRequestState(True, MockPayload("user_mock_clerk_123"))
    mock_user = MockClerkUser("mockfarmer@example.com")
    
    print("\n1. Simulating first login (Upsert User)...")
    with patch('app.core.security.clerk.authenticate_request', new_callable=AsyncMock) as mock_auth, \
         patch('app.core.security.clerk.users.get', new_callable=AsyncMock) as mock_get_user:
             
        mock_auth.return_value = mock_state
        mock_get_user.return_value = mock_user
        
        try:
            user = await get_current_user(request, db)
            print(f"SUCCESS: Synchronized user from Clerk!")
            print(f" - Local DB ID: {user['id']}")
            print(f" - Clerk ID: {user['clerk_id']}")
            print(f" - Email: {user['email']}")
        except Exception as e:
            print(f"FAILED: {e}")
            return
            
    print("\n2. Simulating subsequent login (Fetch User)...")
    with patch('app.core.security.clerk.authenticate_request', new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = mock_state
        # get_user shouldn't be called because the user is already in DB
        
        try:
            user2 = await get_current_user(request, db)
            print(f"SUCCESS: Retrieved existing user {user2['email']}")
            assert user['id'] == user2['id'], "IDs should match!"
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_clerk_auth())
