export type Note = {
  id: string;
  title: string; // may be empty
  body: string;
  createdAt: number; // ms since epoch
  updatedAt: number; // ms since epoch, changes whenever title/body change
};
