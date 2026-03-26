from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from routers import tasks

app = FastAPI(title="test0 API", version="0.1.0")
app.include_router(tasks.router)

_items: dict = {}
_next_id = 1


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class Item(ItemCreate):
    id: int


@app.get("/")
def root():
    return {
        "message": "Hello from test0 API",
        "docs": "/docs",
        "apis": ["/items", "/tasks"],
    }


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
