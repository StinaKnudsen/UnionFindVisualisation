import { createContext, useContext } from "react";

export type Mode = "create" | "delete";

export const ModeContext = createContext<Mode>("create");

