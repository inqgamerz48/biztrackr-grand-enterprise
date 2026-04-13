import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    response = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed for {email}: {response.text}")
    return None

def main():
    # 1. Login as Admin A (admin@biztrackr.com)
    print("Logging in as Admin A...")
    token_a = login("admin@biztrackr.com", "admin123")
    if not token_a:
        sys.exit(1)

    # 2. List users as Admin A
    print("Listing users as Admin A...")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    response = requests.get(f"{BASE_URL}/users/", headers=headers_a)
    if response.status_code != 200:
        print(f"FAIL: Could not list users: {response.text}")
        sys.exit(1)
    
    users_a = response.json()
    print(f"Admin A sees {len(users_a)} users.")
    user_ids_a = [u['id'] for u in users_a]

    # 3. Create a new Tenant B and Admin B (via registration if possible, or assume pre-existing)
    # Since we can't easily create a new tenant via API without a public register endpoint that creates a tenant,
    # we will try to register a new user which creates a new tenant.
    print("Registering new Admin B (new tenant)...")
    reg_data = {
        "email": "admin_b@example.com",
        "password": "password123",
        "full_name": "Admin B",
        "tenant_name": "Company B"
    }
    # Note: Using the register endpoint from auth_service if exposed, usually /auth/register
    # Checking auth router... assuming /auth/register exists based on use-auth.ts
    response = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    if response.status_code not in [200, 201]:
        # If already exists, try to login
        print(f"Registration response: {response.status_code} {response.text}")
    
    print("Logging in as Admin B...")
    token_b = login("admin_b@example.com", "password123")
    if not token_b:
        print("Could not login as Admin B. Skipping B tests.")
        sys.exit(1)

    # 4. List users as Admin B
    print("Listing users as Admin B...")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    response = requests.get(f"{BASE_URL}/users/", headers=headers_b)
    users_b = response.json()
    print(f"Admin B sees {len(users_b)} users.")
    
    # 5. Verify Isolation
    # Admin B should NOT see Admin A's users
    user_ids_b = [u['id'] for u in users_b]
    
    intersection = set(user_ids_a).intersection(set(user_ids_b))
    if intersection:
        print(f"FAIL: Isolation breach! Common users found: {intersection}")
    else:
        print("PASS: User lists are disjoint.")

    # 6. Verify Access Control
    # Admin B tries to get details of an Admin A user
    target_id = user_ids_a[0]
    print(f"Admin B trying to access Admin A user {target_id}...")
    # There isn't a direct get_user endpoint in the snippet, but update_role uses ID
    # Let's try to update role of Admin A user using Admin B token
    response = requests.put(
        f"{BASE_URL}/users/{target_id}/role", 
        headers=headers_b,
        json={"role": "manager"}
    )
    
    if response.status_code == 404:
        print("PASS: Admin B got 404 when accessing Admin A user (Correct isolation).")
    else:
        print(f"FAIL: Admin B got {response.status_code} when accessing Admin A user.")

if __name__ == "__main__":
    main()
