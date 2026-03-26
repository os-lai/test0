from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.requests import Request

from routers import tasks

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="test0 API", version="0.1.0")
app.include_router(tasks.router)


@app.middleware("http")
async def no_cache_ui_assets(request: Request, call_next):
    """Avoid stale CSS/JS in the browser during local development."""
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

_items: dict = {}
_next_id = 1


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class Item(ItemCreate):
    id: int


@app.get("/api/info")
def api_info():
    return {
        "message": "Hello from test0 API",
        "docs": "/docs",
        "apis": ["/items", "/tasks"],
        "ui": "/",
    }


@app.get("/")
async def serve_ui():
    """Serve HTML with asset URLs tied to file mtimes so CSS/JS updates are always picked up."""
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    css_v = int((STATIC_DIR / "styles.css").stat().st_mtime)
    js_v = int((STATIC_DIR / "app.js").stat().st_mtime)
    html = html.replace("__CSS_VER__", str(css_v)).replace("__JS_VER__", str(js_v))
    return HTMLResponse(
        content=html,
        media_type="text/html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/items", response_model=List[Item])
def list_items():
    return [Item(id=iid, **data) for iid, data in sorted(_items.items())]


@app.post("/items", response_model=Item, status_code=201)
def create_item(body: ItemCreate):
    global _next_id
    iid = _next_id
    _next_id += 1
    _items[iid] = body.model_dump()
    return Item(id=iid, **_items[iid])


@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(id=item_id, **_items[item_id])


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int):
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Item not found")
    del _items[item_id]
