export type RootStackParamList = {
  Home: undefined;
  // noteId is missing when the user is creating a brand-new note
  Editor: { noteId?: string };
};
