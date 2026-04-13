import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed for {email}: {response.text}")
    except Exception as e:
        print(f"Login connection failed: {e}")
    return None

def main():
    print("Logging in as Admin...")
    token = login("admin@biztrackr.com", "admin123")
    if not token: sys.exit(1)
    headers = {"Authorization": f"Bearer {token}"}

    print("Checking Notifications...")
    resp_notif = requests.get(f"{BASE_URL}/notifications/?limit=5", headers=headers)
    print(f"Notifications: {resp_notif.status_code}")
    if resp_notif.status_code == 404:
        print("FAIL: Notifications still 404")
    else:
        print("PASS: Notifications found")

    print("Checking AI Insights...")
    resp_ai = requests.get(f"{BASE_URL}/ai/insights", headers=headers)
    print(f"AI Insights: {resp_ai.status_code}")
    if resp_ai.status_code == 404:
        print("FAIL: AI Insights still 404")
    else:
        print("PASS: AI Insights found")

if __name__ == "__main__":
    main()
