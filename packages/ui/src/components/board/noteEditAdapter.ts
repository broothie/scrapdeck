export type NoteEditAdapter = {
  prompt: (message: string, defaultValue?: string) => string | null;
  alert: (message: string) => void;
};

export const browserNoteEditAdapter: NoteEditAdapter = {
  prompt(message, defaultValue) {
    return window.prompt(message, defaultValue);
  },
  alert(message) {
    window.alert(message);
  },
};
