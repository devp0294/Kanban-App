import { useEffect, useState, type KeyboardEvent } from "react";
import type { Column, Task } from "../types";
import TrashIcon from "../icons/TrashIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PlusIcon from "../icons/PlusIcon";
import Taskcard from "./Taskcard";
import { SortableContext } from "@dnd-kit/sortable";

interface Props {
  column: Column;
  deleteColumn: (id: string | number) => void;
  updateColumn: (updated: Column) => void;
  createTask: (columnId: string | number) => void;
  deleteTask: (id: string | number) => void;
  updateTask: (id: string | number, content: string) => void;
  tasks: Task[];
  activeTask: Task | null;
}

function ColumnContainer({
  column,
  deleteColumn,
  updateColumn,
  createTask,
  deleteTask,
  updateTask,
  tasks,
  activeTask,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [resizing, setResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState<number>(column.width ?? 350);

  useEffect(() => {
    setLocalWidth(column.width ?? 350);
  }, [column.width]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: column.id,
      data: { type: "column", column },
      disabled: editMode || resizing,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${localWidth}px`,
  };

  function finishEditing() {
    setEditMode(false);
    updateColumn({ ...column, title });
  }

  function cancelEditing() {
    setTitle(column.title);
    setEditMode(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") finishEditing();
    if (e.key === "Escape") cancelEditing();
  }

  function onMouseDownResize(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setResizing(true);
    document.body.style.cursor = "col-resize";

    const startX = e.clientX;
    const startWidth = localWidth;

    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const newWidth = Math.max(220, startWidth + dx);
      setLocalWidth(newWidth);
    }

    function onMouseUp() {
      setResizing(false);
      document.body.style.cursor = "";
      updateColumn({ ...column, width: localWidth });

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-[#161c22] h-[500px] opacity-50 border-2 border-rose-500 rounded-md"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#161c22] h-[500px] rounded-md flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        onDoubleClick={() => setEditMode(true)}
        className="bg-[#0d1117] h-[60px] cursor-grab flex items-center justify-between p-3 font-bold border-b border-[#161c22] text-white"
      >
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 text-sm">{tasks.length}</div>
          {!editMode ? (
            <div>{title}</div>
          ) : (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              className="bg-[#161c22] text-white px-2 py-1 rounded outline-none"
            />
          )}
        </div>

        <button
          onClick={() => deleteColumn(column.id)}
          className="stroke-gray-400 hover:stroke-white"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="flex flex-col gap-2 grow text-white px-3 py-2 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)}>
          {tasks.map((task) =>
            activeTask?.id === task.id ? null : (
              <Taskcard
                key={task.id}
                task={task}
                deleteTask={deleteTask}
                updateTask={updateTask}
              />
            )
          )}
        </SortableContext>
      </div>

      <div className="text-white px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => createTask(column.id)}
          className="text-sm flex items-center gap-2 hover:text-rose-500 hover:bg-gray-800 flex-1 p-2 rounded"
        >
          <PlusIcon />
          Add Task
        </button>

        <div
          onMouseDown={onMouseDownResize}
          className="w-2 h-8 cursor-col-resize rounded bg-transparent hover:bg-gray-600"
          title="Resize column"
        />
      </div>
    </div>
  );
}

export default ColumnContainer;
