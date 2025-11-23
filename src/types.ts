export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
  width?: number;   // <-- FIXED (required for your resizable columns)
};

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
};
