from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import PlotGeometry

router = APIRouter(prefix="/api/v1/gis", tags=["GIS & Mapping"])

@router.get("/plots", summary="Get all plot geometries as a GeoJSON FeatureCollection")
async def get_plot_geometries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlotGeometry))
    plots = result.scalars().all()
    
    features = []
    for plot in plots:
        features.append({
            "type": "Feature",
            "properties": {
                "id": plot.id,
                "khasra_no": plot.khasra_no,
                "village": plot.village,
                "area_sqm": plot.area_sqm,
            },
            "geometry": {
                # In a real app we'd parse the WKT or use PostGIS ST_AsGeoJSON.
                # For demo purposes, returning a mock polygon
                "type": "Polygon",
                "coordinates": [[[78.9629, 20.5937], [78.9630, 20.5937], [78.9630, 20.5938], [78.9629, 20.5938], [78.9629, 20.5937]]]
            }
        })
        
    # Mock data if DB is empty for UI testing
    if not features:
        features.append({
            "type": "Feature",
            "properties": {"id": 1, "khasra_no": "101/2", "village": "Rampur"},
            "geometry": {"type": "Polygon", "coordinates": [[[78.9629, 20.5937], [78.9630, 20.5937], [78.9630, 20.5938], [78.9629, 20.5938], [78.9629, 20.5937]]]}
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
