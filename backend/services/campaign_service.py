from database.database import SessionLocal

from models.customer import Customer
from models.campaign import Campaign
from models.communication_log import CommunicationLog

from datetime import datetime
import requests
import os
import threading
import time

CHANNEL_SERVICE_URL = os.getenv("CHANNEL_SERVICE_URL", "http://127.0.0.1:8001")


def send_to_channel_service_bg(logs_to_send, channel, campaign_name):
    # This runs in a separate background thread so it doesn't block the API thread
    for log_id, customer_id in logs_to_send:
        # Update status to SENDING in the DB
        db = SessionLocal()
        try:
            log = db.query(CommunicationLog).filter(CommunicationLog.id == log_id).first()
            if log:
                log.status = "SENDING"
                db.commit()
        except Exception as dberr:
            print("Failed to update status to SENDING in background thread:", dberr)
        finally:
            db.close()

        # Pacing: sleep for 150ms to make it look like real-time broadcast progress
        time.sleep(0.15)

        # Call Channel Service
        try:
            requests.post(
                f"{CHANNEL_SERVICE_URL}/send",
                json={
                    "communication_id": log_id,
                    "customer_id": customer_id,
                    "channel": channel,
                    "message": f"{campaign_name} campaign"
                },
                timeout=5
            )
            # Update status to SENT
            db = SessionLocal()
            try:
                log = db.query(CommunicationLog).filter(CommunicationLog.id == log_id).first()
                if log:
                    log.status = "SENT"
                    db.commit()
            except Exception as dberr:
                print("Failed to update status to SENT in background thread:", dberr)
            finally:
                db.close()
        except Exception as e:
            print(f"Channel Service Error for Log {log_id}:", e)
            
            # Update log status to FAILED in the DB
            db = SessionLocal()
            try:
                log = db.query(CommunicationLog).filter(CommunicationLog.id == log_id).first()
                if log:
                    log.status = "FAILED"
                    db.commit()
            except Exception as dberr:
                print("Failed to update status to FAILED in background thread:", dberr)
            finally:
                db.close()


def launch_campaign(
    campaign_name,
    goal,
    channel,
    audience_size
):

    db = SessionLocal()

    try:

        # Create Campaign
        campaign = Campaign(
            name=campaign_name,
            goal=goal,
            audience_size=audience_size,
            channel=channel,
            status="ACTIVE"
        )

        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        # Select Audience
        customers = db.query(Customer).all()
        customers = customers[:audience_size]

        logs_created = 0
        logs_to_send = []

        for customer in customers:

            # Create Communication Log initially in PENDING status
            log = CommunicationLog(
                campaign_id=str(campaign.id),
                customer_id=customer.id,
                channel=channel,
                status="PENDING",
                sent_at=datetime.utcnow()
            )

            db.add(log)

            # Generate ID before commit
            db.flush()

            logs_to_send.append((log.id, customer.id))
            logs_created += 1

        db.commit()

        # Start background thread to send to Channel Service asynchronously
        threading.Thread(
            target=send_to_channel_service_bg,
            args=(logs_to_send, channel, campaign_name),
            daemon=True
        ).start()

        return {
            "campaign_id": campaign.id,
            "campaign_name": campaign_name,
            "audience_size": audience_size,
            "logs_created": logs_created,
            "status": "ACTIVE"
        }

    except Exception as e:

        db.rollback()

        return {
            "error": str(e)
        }

    finally:

        db.close()