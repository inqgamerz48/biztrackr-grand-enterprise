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
    # 1. Login as Admin A
    print("Logging in as Admin A...")
    token_a = login("admin@biztrackr.com", "admin123")
    if not token_a: sys.exit(1)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Update Settings for Admin A
    print("Updating settings for Admin A (Currency: EUR)...")
    response = requests.put(f"{BASE_URL}/settings/", headers=headers_a, json={"currency_symbol": "EUR"})
    if response.status_code != 200:
        print(f"FAIL: Could not update settings for A: {response.text}")
        sys.exit(1)
    
    # 3. Login as Admin B
    print("Logging in as Admin B...")
    token_b = login("admin_b@example.com", "password123")
    if not token_b: sys.exit(1)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 4. Get Settings for Admin B
    print("Getting settings for Admin B...")
    response = requests.get(f"{BASE_URL}/settings/", headers=headers_b)
    settings_b = response.json()
    
    # 5. Verify Isolation
    # Admin B should NOT see EUR (default is $)
    print(f"Admin A Currency: EUR")
    print(f"Admin B Currency: {settings_b.get('currency_symbol')}")
    
    if settings_b.get('currency_symbol') == "EUR":
        print("FAIL: Isolation breach! Admin B sees Admin A's settings.")
    else:
        print("PASS: Settings are isolated.")

if __name__ == "__main__":
    main()
