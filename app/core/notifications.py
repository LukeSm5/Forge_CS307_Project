from __future__ import annotations

import os
import smtplib
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Protocol


class NotificationService(Protocol):
    def send_update_notification(
        self,
        *,
        recipient_email: str,
        username: str,
        update_type: str,
        updated_at: datetime | None = None,
    ) -> None:
        """Send an update notification email."""


@dataclass(frozen=True)
class SMTPSettings:
    host: str
    port: int
    from_email: str
    username: str | None
    password: str | None
    use_tls: bool

    @classmethod
    def from_env(cls) -> "SMTPSettings":
        host = os.getenv("SMTP_HOST", "smtp.sendgrid.net")
        port = int(os.getenv("SMTP_PORT", "587"))
        from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@forge.app")
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"}
        return cls(
            host=host,
            port=port,
            from_email=from_email,
            username=username,
            password=password,
            use_tls=use_tls,
        )


class SMTPNotificationService:
    def __init__(self, settings: SMTPSettings):
        self.settings = settings

    def send_update_notification(
        self,
        *,
        recipient_email: str,
        username: str,
        update_type: str,
        updated_at: datetime | None = None,
    ) -> None:
        when = (updated_at or datetime.now(timezone.utc)).isoformat()
        subject = f"Forge account update: {update_type}"
        body = (
            f"Hi {username},\n\n"
            f"We detected an update on your Forge account.\n"
            f"Update type: {update_type}\n"
            f"Time (UTC): {when}\n\n"
            "If this was not you, please secure your account immediately.\n"
        )

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.settings.from_email
        msg["To"] = recipient_email
        msg.set_content(body)

        with smtplib.SMTP(self.settings.host, self.settings.port, timeout=10) as smtp:
            if self.settings.use_tls:
                smtp.starttls()
            if self.settings.username and self.settings.password:
                smtp.login(self.settings.username, self.settings.password)
            smtp.send_message(msg)


class NoopNotificationService:
    def send_update_notification(
        self,
        *,
        recipient_email: str,
        username: str,
        update_type: str,
        updated_at: datetime | None = None,
    ) -> None:
        return


def get_notification_service() -> NotificationService:
    enabled = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false").lower() in {"1", "true", "yes"}
    if not enabled:
        return NoopNotificationService()

    provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()
    if provider == "smtp":
        return SMTPNotificationService(SMTPSettings.from_env())

    raise ValueError(f"Unsupported EMAIL_PROVIDER: {provider}")
