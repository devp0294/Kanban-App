import { useMemo, useState } from "react";
import PlusIcon from "../icons/PlusIcon";
import type { Column, Task } from "../types";
import ColumnContainer from "./ColumnContainer";

import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  useSensors,
  useSensor,
  PointerSensor,
} from "@dnd-kit/core";

import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import Taskcard from "./Taskcard";

const KanbanBoard = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  function handleDragStart(event: DragStartEvent) {
    const payload = event.active.data.current;
    if (!payload) return;
    if (payload.type === "column") setActiveColumn(payload.column as Column);
    else if (payload.type === "task") setActiveTask(payload.task as Task);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveColumn(null);
    setActiveTask(null);

    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data?.current;
    if (!activeData || !overData) return;

    // Column reordering
    if (activeData.type === "column" && overData.type === "column") {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex)
        setColumns((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    // Task drag
    if (activeData.type === "task") {
      const draggedTask: Task = activeData.task;
      const targetColumnId =
        overData.type === "column" ? overData.column.id : (overData.task as Task).columnId;

      setTasks((prevTasks) => {
        const withoutDragged = prevTasks.filter((t) => t.id !== draggedTask.id);
        const targetTasks = withoutDragged.filter((t) => t.columnId === targetColumnId);

        let insertIndex = targetTasks.length;
        if (overData.type === "task") {
          insertIndex = targetTasks.findIndex((t) => t.id === (overData.task as Task).id);
          if (insertIndex === -1) insertIndex = targetTasks.length;
        }

        // rebuild array with correct order
        const rebuilt: Task[] = [];
        for (const col of columns) {
          if (col.id !== targetColumnId) rebuilt.push(...withoutDragged.filter((t) => t.columnId === col.id));
          else {
            const tTasks = withoutDragged.filter((t) => t.columnId === targetColumnId);
            rebuilt.push(...tTasks.slice(0, insertIndex));
            rebuilt.push({ ...draggedTask, columnId: targetColumnId });
            rebuilt.push(...tTasks.slice(insertIndex));
          }
        }

        return rebuilt;
      });
    }
  }

  function createNewColumn() {
    const newColumn: Column = { id: generateId(), title: `Column ${columns.length + 1}`, width: 350 };
    setColumns((prev) => [...prev, newColumn]);
  }

  function deleteColumn(id: string | number) {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.columnId !== id));
  }

  function updateColumn(updatedColumn: Column) {
    setColumns((prev) => prev.map((c) => (c.id === updatedColumn.id ? { ...c, ...updatedColumn } : c)));
  }

  function createTask(columnId: string | number) {
    const newTask: Task = { id: generateId(), columnId, content: `Task ${tasks.length + 1}` };
    setTasks((prev) => [...prev, newTask]);
  }

  function deleteTask(id: string | number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTask(id: string | number, content: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  }

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-10">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={onDragEnd}>
        <div className="m-auto flex gap-2">
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <ColumnContainer
                key={col.id}
                column={col}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                tasks={tasks.filter((t) => t.columnId === col.id)}
                activeTask={activeTask}
              />
            ))}
          </SortableContext>

          <button
            onClick={createNewColumn}
            className="h-[60px] w-[350px] min-w-[350px] flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-gray-900 border-2 border-gray-400 p-4 hover:ring-2 hover:text-rose-500 duration-300 hover:ring-rose-500"
          >
            <PlusIcon />
            Add Column
          </button>
        </div>

        {createPortal(
          <DragOverlay>
            {activeColumn ? (
              <ColumnContainer
                column={activeColumn}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                tasks={tasks.filter((t) => t.columnId === activeColumn.id)}
                activeTask={activeTask}
              />
            ) : activeTask ? (
              <Taskcard task={activeTask} deleteTask={deleteTask} updateTask={updateTask} />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

function generateId() {
  return Math.floor(Math.random() * 1000000).toString();
}

export default KanbanBoard;
