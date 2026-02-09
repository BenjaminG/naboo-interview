import { DebugContext } from "@/contexts/debugContext";
import { useContext } from "react";

export function useDebugMode() {
  const context = useContext(DebugContext);
  return context;
}
