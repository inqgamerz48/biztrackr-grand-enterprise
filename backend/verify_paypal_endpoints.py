import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")
    return None

def main():
    print("Logging in as Admin...")
    token = login("admin@biztrackr.com", "admin123")
    if not token: sys.exit(1)
    headers = {"Authorization": f"Bearer {token}"}

    print("Checking PayPal Create Order Endpoint...")
    # Expecting 400 or 500 because credentials are missing/invalid, but NOT 404
    resp = requests.post(f"{BASE_URL}/billing/paypal/create-order?plan=pro", headers=headers)
    print(f"Create Order Status: {resp.status_code}")
    
    if resp.status_code == 404:
        print("FAIL: Endpoint not found")
    else:
        print("PASS: Endpoint found (Error expected due to missing creds)")

    print("Checking PayPal Capture Endpoint...")
    # Expecting 400/500/422, NOT 404
    resp = requests.post(f"{BASE_URL}/billing/paypal/capture-payment?payment_id=fake&payer_id=fake", headers=headers)
    print(f"Capture Payment Status: {resp.status_code}")
    
    if resp.status_code == 404:
        print("FAIL: Endpoint not found")
    else:
        print("PASS: Endpoint found")

if __name__ == "__main__":
    main()
