import { create } from "zustand";

type AdminState = {
  search: string;
  setSearch: (v: string) => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  search: "",
  setSearch: (v) => set({ search: v }),
}));
