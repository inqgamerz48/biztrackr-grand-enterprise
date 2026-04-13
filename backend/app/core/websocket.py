from typing import List, Dict, Set
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # tenant_id -> set of active websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = set()
        self.active_connections[tenant_id].add(websocket)

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self.active_connections:
            self.active_connections[tenant_id].remove(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_tenant(self, message: dict, tenant_id: str):
        if tenant_id in self.active_connections:
            payload = json.dumps(message)
            for connection in self.active_connections[tenant_id]:
                await connection.send_text(payload)

manager = ConnectionManager()
