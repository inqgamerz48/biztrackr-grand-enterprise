import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    response = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed for {email}: {response.text}")
    return None

def check_permission(token, endpoint, method="GET"):
    headers = {"Authorization": f"Bearer {token}"}
    if method == "GET":
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    elif method == "POST":
        response = requests.post(f"{BASE_URL}{endpoint}", headers=headers)
    
    return response.status_code

def main():
    # Login as admin
    admin_token = login("admin@biztrackr.com", "admin123")
    if not admin_token:
        sys.exit(1)

    # Verify admin has permissions (should be able to access /users/me and see permissions)
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if response.status_code == 200:
        user_data = response.json()
        print(f"Admin permissions: {user_data.get('permissions')}")
        if not user_data.get('permissions'):
            print("FAIL: Admin permissions not found in response")
        else:
            print("PASS: Admin permissions present")
    else:
        print(f"FAIL: Could not get admin info: {response.text}")

    # TODO: Create a cashier user and test restricted access if possible, 
    # but for now verifying the schema update and admin access is a good first step.

if __name__ == "__main__":
    main()
