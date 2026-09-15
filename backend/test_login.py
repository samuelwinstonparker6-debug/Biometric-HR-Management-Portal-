import requests
import json

url = "http://127.0.0.1:5001/api/login"
payload = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Payload: {payload}")

try:
    response = requests.post(url, json=payload)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"JSON: {response.json()}")
except Exception as e:
    print(f"ERROR: {str(e)}")
