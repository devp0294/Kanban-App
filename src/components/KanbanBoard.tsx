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

const KanbanBoard = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  // array of column ids for SortableContext
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  function handleDragStart(event: DragStartEvent) {
    const payload = event.active.data.current;
    if (!payload) return;
    if (payload.type === "column") {
      setActiveColumn(payload.column as Column);
    } else if (payload.type === "task") {
      setActiveTask(payload.task as Task);
    }
  }

  function deleteTask(id: string | number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTask(id: string | number, content: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content } : t))
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveColumn(null);
    setActiveTask(null);

    if (!over) return;
    const activePayload = active.data.current;
    const overPayload = over.data?.current;

    if (!activePayload || !overPayload) return;

    // COLUMN drag
    if (activePayload.type === "column" && overPayload.type === "column") {
      const activeId = active.id;
      const overId = over.id;
      if (activeId === overId) return;

      setColumns((prev) => {
        const oldIndex = prev.findIndex((col) => col.id === activeId);
        const newIndex = prev.findIndex((col) => col.id === overId);
        return arrayMove(prev, oldIndex, newIndex);
      });
      return;
    }

    // TASK drag (can be within same column or across columns)
    if (activePayload.type === "task" && (overPayload.type === "task" || overPayload.type === "column")) {
      const draggedTask: Task = activePayload.task;
      const sourceColumnId = draggedTask.columnId;
      const targetColumnId =
        overPayload.type === "column" ? overPayload.column.id : (overPayload.task as Task).columnId;

      // remove dragged task from tasks array
      setTasks((prevTasks) => {
        // create list of tasks in source column without the dragged one
        const withoutDragged = prevTasks.filter((t) => t.id !== draggedTask.id);

        // build target tasks list to compute insertion index
        const targetTasks = withoutDragged.filter((t) => t.columnId === targetColumnId);

        let insertIndexInTarget = targetTasks.length; // default append

        if (overPayload.type === "task") {
          const overTask = overPayload.task as Task;
          // find index of overTask in targetTasks
          const indexInTarget = targetTasks.findIndex((t) => t.id === overTask.id);
          if (indexInTarget !== -1) {
            // decide whether to insert before or after? we'll insert before the over item
            insertIndexInTarget = indexInTarget;
          }
        } else {
          // over is a column -> append at end
          insertIndexInTarget = targetTasks.length;
        }

        // now rebuild the full tasks array inserting the dragged task (with updated columnId) at the right place
        const rebuilt: Task[] = [];
        for (const col of columns) {
          if (col.id !== targetColumnId) {
            // push tasks that belong to other columns
            const otherTasks = withoutDragged.filter((t) => t.columnId === col.id);
            rebuilt.push(...otherTasks);
          } else {
            // when we reach target column, push its tasks with insertion
            const tTasks = withoutDragged.filter((t) => t.columnId === targetColumnId);
            // insert all tasks before insertion point
            rebuilt.push(...tTasks.slice(0, insertIndexInTarget));
            // insert dragged task with updated columnId
            rebuilt.push({ ...draggedTask, columnId: targetColumnId });
            // remaining tasks
            rebuilt.push(...tTasks.slice(insertIndexInTarget));
          }
        }

        return rebuilt;
      });

      return;
    }
  }

  function createNewColumn() {
    const newColumn: Column = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
      width: 350, // default width (px)
    };
    setColumns((prev) => [...prev, newColumn]);
  }

  function deleteColumn(id: string | number) {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.columnId !== id));
  }

  function updateColumn(updatedColumn: Column) {
    setColumns((prev) =>
      prev.map((col) => (col.id === updatedColumn.id ? { ...col, ...updatedColumn } : col))
    );
  }

  function createTask(columnId: string | number) {
    const newTask: Task = {
      id: generateId(),
      columnId,
      content: `Task ${tasks.length + 1}`,
    };
    setTasks((prev) => [...prev, newTask]);
  }

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="m-auto flex gap-2">
          <div className="flex gap-2">
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
  tasks={tasks.filter((task) => task.columnId === col.id)}
  activeTask={activeTask}    // ⬅ NEW
/>

              ))}
            </SortableContext>
          </div>

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
                activeTask={activeTask}
                tasks={tasks.filter((t) => t.columnId === activeColumn.id)}
              />
            ) : activeTask ? (
              // render a lightweight Taskcard as overlay when dragging a task
              <div className="w-[300px] p-2">
                <div className="bg-[#0d1117] p-2 rounded border border-[#161c22] text-white">
                  {activeTask.content}
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

function generateId(): string {
  return Math.floor(Math.random() * 1000000).toString();
}

export default KanbanBoard;
