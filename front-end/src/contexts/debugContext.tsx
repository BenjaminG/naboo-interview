import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const DEBUG_MODE_KEY = "debug_mode";

interface DebugContextType {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}

export const DebugContext = createContext<DebugContextType>({
  isDebugMode: false,
  toggleDebugMode: () => {},
});

interface DebugProviderProps {
  children: React.ReactNode;
}

export const DebugProvider = ({ children }: DebugProviderProps) => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DEBUG_MODE_KEY);
    setIsDebugMode(stored === "true");
  }, []);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(DEBUG_MODE_KEY, "true");
      } else {
        localStorage.removeItem(DEBUG_MODE_KEY);
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isDebugMode, toggleDebugMode }),
    [isDebugMode, toggleDebugMode]
  );

  return (
    <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
  );
};
