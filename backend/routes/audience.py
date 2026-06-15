from fastapi import APIRouter

from services.segmentation_service import (
    get_audience_insights
)

router = APIRouter()


@router.get("/audience/preview")
def preview_audience():

    return get_audience_insights()