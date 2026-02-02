import { createContext, useContext } from "react";

export type Mode = "create" | "delete";

export const ModeContext = createContext<Mode>("create");

export function useMode(): Mode {
  return useContext(ModeContext);
}
