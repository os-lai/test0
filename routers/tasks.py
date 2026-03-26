from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/tasks", tags=["tasks"])

_tasks: dict = {}
_next_id = 1


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    done: bool = False


class Task(TaskCreate):
    id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    done: Optional[bool] = None


@router.get("", response_model=List[Task])
def list_tasks():
    return [Task(id=tid, **data) for tid, data in sorted(_tasks.items())]


@router.post("", response_model=Task, status_code=201)
def create_task(body: TaskCreate):
    global _next_id
    tid = _next_id
    _next_id += 1
    _tasks[tid] = body.model_dump()
    return Task(id=tid, **_tasks[tid])


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: int):
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(id=task_id, **_tasks[task_id])


@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: int, body: TaskUpdate):
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    data = _tasks[task_id].copy()
    updates = body.model_dump(exclude_unset=True)
    data.update(updates)
    _tasks[task_id] = data
    return Task(id=task_id, **data)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int):
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    del _tasks[task_id]
