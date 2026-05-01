from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Portfolio", version="0.1.1-dev")


@app.middleware("http")
async def no_cache_ui_assets(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


@app.get("/")
async def serve_ui():
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    css_v = int((STATIC_DIR / "styles.css").stat().st_mtime)
    js_v = int((STATIC_DIR / "site.js").stat().st_mtime)
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
    return {"status": "ok", "workspace": "test0"}
