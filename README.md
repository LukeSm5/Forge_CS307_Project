# Forge_CS307_Project
A workout and diet tracking app that integrates AI to help give personalized advice and keep them on their fitness goals. CS 307 Group Project


```
branch architecture
-> app
  -> fast_api
    -> api.py      # server side work (host session, process requests)
  -> core
    -> db.py       # database schema (Profile(PK: ID - INTEGER NOT NULL, ...))
    -> repos.py    # database side work (write queries)
-> react_frontend
  -> main.jsx      # client side work (colors & buttons, create requests)
  -> api.jsx       # connects client to server (send requests)
  ```

## Email Update Notifications

User Story 21 is implemented in the FastAPI backend:
- `PATCH /accounts/{user_id}/profile` updates username/bio and sends an email notification.
- `POST /accounts/{user_id}/change_password` updates password and sends an email notification.

Email provider integration is configured with environment variables:
- `EMAIL_NOTIFICATIONS_ENABLED` (`true`/`false`)
- `EMAIL_PROVIDER` (`smtp`)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM_EMAIL`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS` (`true`/`false`)

Trigger-focused tests are in:
- `app/fast_api/test_update_notifications.py`
