cle# Pastry Shop

This project is a Python application that uses a virtual environment and has database dependencies.

## Setup

1.  **Create a virtual environment:**

    ```bash
    python -m venv venv
    ```

2.  **Activate the virtual environment:**

    - **On macOS and Linux:**

      ```bash
      source venv/bin/activate
      ```

    - **On Windows:**

      ```bash
      .\\venv\\Scripts\\activate
      ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Create database tables:**

    ```bash
    python -m app.db.init_db
    ```

## Running the Application

To run the application, use the following command:

```bash
py -3.13 -m uvicorn app.main:app --reload
```

## Twilio WhatsApp (Sandbox) Integration

The project now supports customer WhatsApp status notifications and Twilio status callbacks.

### Required env keys

Copy values from `.env.notifications.example` into `.env` and set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER` (sandbox sender)
- `ENABLE_WHATSAPP_NOTIFICATIONS=true`
- `ENABLE_CUSTOMER_WHATSAPP_NOTIFICATIONS=true`

Optional callback:

- `TWILIO_STATUS_CALLBACK_URL=https://<public-domain>/api/v1/webhooks/twilio/status`
- `TWILIO_VALIDATE_WEBHOOK_SIGNATURE=true` (recommended on live)

Note: Twilio rejects localhost callback URLs; use a public tunnel URL in local development.

### Local live-test flow

1) Start API

```powershell
py -3.13 -m uvicorn app.main:app --reload
```

2) Expose local API with ngrok (or equivalent)

```powershell
ngrok http 8000
```

3) Put ngrok HTTPS URL into `TWILIO_STATUS_CALLBACK_URL` and restart API.

4) Ensure test customer joined Twilio WhatsApp sandbox.

5) Create an order, then update order status from seller panel (`new -> preparing -> delivered`).

6) Check notifications list via seller API:

```powershell
GET /api/v1/notifications/
```

Twilio callback endpoint:

```powershell
POST /api/v1/webhooks/twilio/status
```

## Development

### Dependency Management

- **To see all dependencies:**

  ```bash
  pip freeze
  ```

- **To save dependencies to `requirements.txt`:**

  ```bash
  pip freeze > requirements.txt
  ```
