from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import logging
from datetime import UTC, datetime

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


class OrderTrackingConnectionManager:
    """Manage WebSocket connections per order tracking token."""

    def __init__(self):
        self.connections_by_token: dict[str, list[WebSocket]] = {}

    async def connect(self, tracking_token: str, websocket: WebSocket):
        await websocket.accept()
        self.connections_by_token.setdefault(tracking_token, []).append(websocket)

    def disconnect(self, tracking_token: str, websocket: WebSocket):
        token_connections = self.connections_by_token.get(tracking_token, [])
        if websocket in token_connections:
            token_connections.remove(websocket)
        if not token_connections and tracking_token in self.connections_by_token:
            self.connections_by_token.pop(tracking_token, None)

    async def broadcast(self, tracking_token: str, message: dict):
        disconnected: list[WebSocket] = []
        for connection in self.connections_by_token.get(tracking_token, []):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting order tracking message: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(tracking_token, conn)


order_tracking_manager = OrderTrackingConnectionManager()


async def broadcast_new_order_notification(order) -> None:
    """Broadcast a new order notification to all connected WebSocket clients.
    Called from the order creation endpoint."""
    notification_data = {
        "type": "notification",
        "id": f"ws-{order.id}-{datetime.now(UTC).timestamp()}",
        "order_id": order.id,
        "channel": "panel",
        "status": "sent",
        "message": f"Yeni siparis #{order.id} - {order.full_name} - {order.total} TRY",
        "created_at": datetime.now(UTC).isoformat(),
        "is_read": False,
        "subject": f"Yeni Sipariş #{order.id}",
        "play_sound": True,
    }
    await manager.broadcast(notification_data)
    logger.info(f"Broadcasted new order notification for order #{order.id} to {len(manager.active_connections)} clients")


async def broadcast_order_tracking_update(order) -> None:
    """Broadcast updates to customers subscribed via tracking token."""
    if not getattr(order, "tracking_token", None):
        return

    payload = {
        "type": "order_update",
        "order_id": order.id,
        "status": order.status,
        "total": float(order.total),
        "currency_code": order.currency_code,
        "updated_at": datetime.now(UTC).isoformat(),
    }
    await order_tracking_manager.broadcast(order.tracking_token, payload)


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


@router.websocket("/ws/orders/{tracking_token}")
async def order_tracking_websocket(websocket: WebSocket, tracking_token: str):
    """Customer websocket endpoint for order tracking updates."""
    await order_tracking_manager.connect(tracking_token, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        order_tracking_manager.disconnect(tracking_token, websocket)
    except Exception as e:
        logger.error(f"Order tracking websocket error: {e}")
        order_tracking_manager.disconnect(tracking_token, websocket)


