from database.database import SessionLocal

from models.customer import Customer
from models.campaign import Campaign
from models.communication_log import CommunicationLog

from datetime import datetime
import requests
import os

CHANNEL_SERVICE_URL = os.getenv("CHANNEL_SERVICE_URL", "http://127.0.0.1:8001")


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

        for customer in customers:

            # Create Communication Log
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

            # Send to Channel Service
            try:

                requests.post(
                    f"{CHANNEL_SERVICE_URL}/send",
                    json={
                        "communication_id": log.id,
                        "customer_id": customer.id,
                        "channel": channel,
                        "message": f"{campaign_name} campaign"
                    },
                    timeout=5
                )

            except Exception as e:

                print(
                    f"Channel Service Error for Log {log.id}:",
                    e
                )

                log.status = "FAILED"

            logs_created += 1

        db.commit()

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