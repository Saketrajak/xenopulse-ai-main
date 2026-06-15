from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import engine, Base

from models.customer import Customer
from models.order import Order
from models.campaign import Campaign
from models.communication_log import CommunicationLog
from routes.demo import router as demo_router
from routes.stats import router as stats_router
from routes.campaigns import router as campaign_router
from routes.audience import router as audience_router
from routes.launch import router as launch_router
from routes.communications import router as communications_router
from routes.agent import router as agent_router
from routes.upload import router as upload_router

app = FastAPI(
    title="XenoPulse AI"
)

# Allow frontend (Next.js on port 3000) to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(demo_router)
app.include_router(stats_router)
app.include_router(campaign_router)
app.include_router(audience_router)
app.include_router(launch_router)
app.include_router(communications_router)
app.include_router(agent_router)
app.include_router(upload_router)


@app.get("/")
def root():
    return {
        "message": "XenoPulse AI Backend Running"
    }