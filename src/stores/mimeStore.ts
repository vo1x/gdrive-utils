import { create } from "zustand";

import type { MimeData } from "@/types/mime";

// add a proper type for subfolder later

type Store = {
  mime: MimeData;
  updateMimeStore: (newMimeData: Partial<MimeData>) => void;
  setMimeStore: (newMimeData: MimeData) => void;
  resetMimeStore: () => void;
};

export const useMimeStore = create<Store>((set) => ({
  mime: {
    id: null,
    type: "file",
    name: "",
    size: 0,
    webContentLink: "",
    mimeType: "",
    files: null,
    subFolders: null,
  },
  updateMimeStore: (newMimeData) =>
    set((state) => ({ mime: { ...state.mime, ...newMimeData } })),
  setMimeStore: (newMimeData) => set({ mime: { ...newMimeData } }),
  resetMimeStore: () =>
    set({
      mime: {
        id: null,
        type: "file",
        name: "",
        size: 0,
        webContentLink: "",
        mimeType: "",
        files: null,
        subFolders: null,
      },
    }),
}));
