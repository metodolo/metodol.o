"""Backend tests for Strategy CRUD API endpoints (MongoDB-backed)."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL') or 'https://radar-blacklist-hub.preview.emergentagent.com'
BASE_URL = BASE_URL.rstrip('/')

ADMIN_CPF = "154.831.997-07"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    device_id = f"test-device-{uuid.uuid4()}"
    r = requests.post(f"{BASE_URL}/api/auth/login/cpf",
                      json={"cpf": ADMIN_CPF, "password": ADMIN_PASSWORD, "device_id": device_id},
                      timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("session_token") or data.get("token") or data.get("access_token")
    assert tok, f"No session token in response: {data}"
    return tok


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_strategy(headers):
    payload = {"name": "TEST_APIStrategy", "triggerNums": [5, 10], "entryNums": [20, 25], "active": True}
    r = requests.post(f"{BASE_URL}/api/strategies", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
    data = r.json()
    yield data
    # cleanup
    sid = data.get("id")
    if sid:
        requests.delete(f"{BASE_URL}/api/strategies/{sid}", headers=headers, timeout=15)


def test_create_strategy_shape(created_strategy):
    d = created_strategy
    assert d["name"] == "TEST_APIStrategy"
    assert d["triggerNums"] == [5, 10]
    assert d["entryNums"] == [20, 25]
    assert d["active"] is True
    assert isinstance(d.get("id"), str) and len(d["id"]) > 0
    assert "_id" not in d


def test_list_strategies_contains_created(headers, created_strategy):
    r = requests.get(f"{BASE_URL}/api/strategies", headers=headers, timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    match = [s for s in items if s.get("id") == created_strategy["id"]]
    assert match, "Created strategy not returned in list"
    s = match[0]
    assert s["name"] == "TEST_APIStrategy"
    assert s["triggerNums"] == [5, 10]
    assert s["entryNums"] == [20, 25]
    assert "_id" not in s


def test_list_strategies_unauthenticated():
    r = requests.get(f"{BASE_URL}/api/strategies", timeout=15)
    assert r.status_code in (401, 403), f"Unexpected status for unauth: {r.status_code}"


def test_toggle_active_persists(headers, created_strategy):
    sid = created_strategy["id"]
    # toggle to inactive
    r = requests.put(f"{BASE_URL}/api/strategies/{sid}", json={"active": False},
                     headers=headers, timeout=15)
    assert r.status_code == 200
    # verify via GET
    r = requests.get(f"{BASE_URL}/api/strategies", headers=headers, timeout=15)
    got = [s for s in r.json() if s["id"] == sid][0]
    assert got["active"] is False
    # toggle back
    r = requests.put(f"{BASE_URL}/api/strategies/{sid}", json={"active": True},
                     headers=headers, timeout=15)
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/api/strategies", headers=headers, timeout=15)
    got = [s for s in r.json() if s["id"] == sid][0]
    assert got["active"] is True


def test_non_admin_cannot_create():
    # Missing token → unauthorized
    r = requests.post(f"{BASE_URL}/api/strategies",
                      json={"name": "TEST_x", "triggerNums": [1], "entryNums": [2]},
                      timeout=15)
    assert r.status_code in (401, 403)


def test_delete_strategy(headers):
    payload = {"name": "TEST_ToDelete", "triggerNums": [1], "entryNums": [2], "active": True}
    r = requests.post(f"{BASE_URL}/api/strategies", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200
    sid = r.json()["id"]
    r = requests.delete(f"{BASE_URL}/api/strategies/{sid}", headers=headers, timeout=15)
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/api/strategies", headers=headers, timeout=15)
    assert not any(s["id"] == sid for s in r.json())
