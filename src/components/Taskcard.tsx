import { useState } from "react";
import TrashIcon from "../icons/TrashIcon";
import type { Id, Task } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  task: Task;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
}

const Taskcard = ({ task, deleteTask, updateTask }: Props) => {
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.content);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { type: "task", task },
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const finishEdit = () => {
    setIsEditing(false);
    if (value.trim()) updateTask(task.id, value);
    else setValue(task.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") finishEdit();
    if (e.key === "Escape") {
      setValue(task.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => setMouseIsOver(false)}
      onDoubleClick={startEdit}
      className="relative bg-[#0d1117] p-2 rounded border border-[#161c22] py-5 hover:border-rose-500 duration-300 cursor-grab"
    >
      {isEditing ? (
        <input
          autoFocus
          className="w-full bg-[#161c22] text-white px-2 py-1 rounded outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        value
      )}

      {mouseIsOver && !isEditing && (
        <button
          onClick={() => deleteTask(task.id)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0d1117] p-1 rounded stroke-white hover:scale-105 duration-100"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default Taskcard;
