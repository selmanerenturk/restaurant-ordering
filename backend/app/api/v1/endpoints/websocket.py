from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app.api.dependencies import get_db
from app.db.CRUD.notifications import get_notifications, get_unread_notification_count

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active WebSocket connections per seller
active_connections: dict = {}


class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: list = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        # Clean up disconnected clients
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")


manager = ConnectionManager()


async def broadcast_new_order_notification(order) -> None:
    """Broadcast a new order notification to all connected WebSocket clients.
    Called from the order creation endpoint."""
    notification_data = {
        "type": "notification",
        "id": f"ws-{order.id}-{datetime.utcnow().timestamp()}",
        "order_id": order.id,
        "channel": "panel",
        "status": "sent",
        "message": f"🆕 Yeni sipariş #{order.id} - {order.full_name} - {order.total} TRY",
        "created_at": datetime.utcnow().isoformat(),
        "is_read": False,
        "subject": f"Yeni Sipariş #{order.id}",
        "play_sound": True,
    }
    await manager.broadcast(notification_data)
    logger.info(f"Broadcasted new order notification for order #{order.id} to {len(manager.active_connections)} clients")


@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time notifications"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive ping/keep-alive messages
            data = await websocket.receive_text()
            
            if data == "ping":
                # Send unread count as pong response
                unread_count = get_unread_notification_count(db)
                await manager.send_personal(
                    websocket,
                    {"type": "pong", "unread_count": unread_count}
                )
            elif data == "get_notifications":
                # Send recent notifications
                notifications = get_notifications(db, limit=10)
                notif_data = [
                    {
                        "id": n.id,
                        "order_id": n.order_id,
                        "channel": n.channel.value,
                        "status": n.status.value,
                        "message": n.message,
                        "created_at": n.created_at.isoformat(),
                        "is_read": n.is_read,
                    }
                    for n in notifications
                ]
                await manager.send_personal(
                    websocket,
                    {"type": "notifications", "data": notif_data}
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from notifications WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

