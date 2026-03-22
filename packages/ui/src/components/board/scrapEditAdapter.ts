export type ScrapEditAdapter = {
  prompt: (message: string, defaultValue?: string) => string | null;
  alert: (message: string) => void;
};

export const browserScrapEditAdapter: ScrapEditAdapter = {
  prompt(message, defaultValue) {
    return window.prompt(message, defaultValue);
  },
  alert(message) {
    window.alert(message);
  },
};
