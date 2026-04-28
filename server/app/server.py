from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health
from app.routes import supply_chain
from app.services.supply_chain_service import supply_chain_service
from app.utils.maps import maps_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    if maps_client.is_enabled():
        result = await supply_chain_service.enrich_with_google_maps()
        print(f"[Startup] Google Maps enrichment: {result}")
    yield


app = FastAPI(docs_url="/docs", redoc_url="/redoc", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(supply_chain.router)


@app.get("/")
async def read_root() -> dict[str, str]:
    """Root endpoint returning a greeting."""
    return {"message": "Hello World"}
