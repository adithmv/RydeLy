import copy
import threading
import time
from types import SimpleNamespace
import pytest
from firebase_admin import db, auth
from app import create_app


class MemoryDatabase:
    """Test-only RTDB double, with serialized copy-on-write transactions."""
    def __init__(self):
        self.data = {}
        self.lock = threading.RLock()
    def reference(self, path):
        return Reference(self, [p for p in path.split("/") if p])


class Reference:
    def __init__(self, database, parts):
        self.database, self.parts = database, parts
    def get(self):
        with self.database.lock:
            value = self.database.data
            for part in self.parts:
                if not isinstance(value, dict):
                    return None
                value = value.get(part)
            return copy.deepcopy(value)
    def set(self, value):
        with self.database.lock:
            if not self.parts:
                self.database.data = copy.deepcopy(value)
                return
            node = self.database.data
            for part in self.parts[:-1]:
                node = node.setdefault(part, {})
            node[self.parts[-1]] = copy.deepcopy(value)
    def update(self, value):
        with self.database.lock:
            record = self.get() or {}
            record.update(value)
            self.set(record)
    def delete(self):
        with self.database.lock:
            node = self.database.data
            for part in self.parts[:-1]:
                node = node.get(part, {})
            node.pop(self.parts[-1], None)
    def transaction(self, callback):
        with self.database.lock:
            result = callback(self.get())
            self.set(result)
            return copy.deepcopy(result)
    def push(self):
        import uuid
        ref = Reference(self.database, self.parts+[uuid.uuid4().hex])
        ref.key = ref.parts[-1]
        return ref


@pytest.fixture
def system(monkeypatch):
    database = MemoryDatabase()
    monkeypatch.setattr(db, "reference", database.reference)
    monkeypatch.setattr(auth,"get_user",lambda uid:SimpleNamespace(disabled=False,tokens_valid_after_timestamp=0))
    app = create_app(overrides={"TESTING":True,"SECRET_KEY":"test-secret-not-for-deployment","RATELIMIT_ENABLED":False,"ORS_API_KEY":"test-key","FRONTEND_URL":"http://localhost:5173,http://127.0.0.1:5173","ALLOWED_ORIGINS":["http://localhost:5173","http://127.0.0.1:5173"]})
    from app.services import routing
    monkeypatch.setattr(routing,"provider",lambda *a,**k:{"features":[{"properties":{"summary":{"distance":4500,"duration":720}},"geometry":{"coordinates":[[75.3704,11.8745],[75.397,11.89]]}}]})
    def client(uid, role="commuter"):
        user={"phone":"+910000000000","name":uid,"isBanned":False}
        if role=="driver":
            user["driverId"]=uid+"-driver"
            database.reference(f"/drivers/{uid}-driver").set({"uid":uid,"name":uid,"isVerified":True,"isBanned":False,"autoNumber":"KL13 TEST"})
        database.reference(f"/users/{uid}").set(user)
        if role=="admin":
            database.reference(f"/admins/{uid}").set(True)
        sid=uid+"-session"
        database.reference(f"/sessions/{sid}").set({"uid":uid,"authTime":time.time(),"expiresAt":time.time()+3600})
        c=app.test_client()
        with c.session_transaction() as sess:
            sess.update(sid=sid,csrf="test-csrf")
        return c
    return app, database, client


def post(client, path, data=None):
    return client.post(path,json=data or {},headers={"X-CSRF-Token":"test-csrf","Origin":"http://localhost:5173"})


PICKUP={"lat":11.8745,"lng":75.3704,"label":"Kannur Railway Station"}
DESTINATION={"lat":11.89,"lng":75.397,"label":"Town centre"}


def position(place=PICKUP):
    return {"lat":place["lat"],"lng":place["lng"],"accuracy":10,"capturedAt":time.time()}


def book(client, request_key="request-one", service="auto"):
    quote=post(client,"/rides/quote",{"pickup":PICKUP,"destination":DESTINATION,"service":service})
    assert quote.status_code==200,quote.json
    ride=post(client,"/rides",{"quoteId":quote.json["id"],"requestKey":request_key,"fare":1})
    assert ride.status_code==201,ride.json
    return ride.json
