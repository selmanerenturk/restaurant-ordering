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
python3 -m uvicorn app.main:app --reload
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
