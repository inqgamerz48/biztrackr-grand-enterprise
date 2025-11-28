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
    print("Logging in as Admin...")
    token = login("admin@biztrackr.com", "admin123")
    if not token: sys.exit(1)
    headers = {"Authorization": f"Bearer {token}"}

    print("Fetching tenants...")
    response = requests.get(f"{BASE_URL}/admin/tenants", headers=headers)
    
    if response.status_code == 200:
        print("SUCCESS: Fetched tenants.")
        print(response.json())
    else:
        print(f"FAIL: {response.status_code} - {response.text}")

if __name__ == "__main__":
    main()
