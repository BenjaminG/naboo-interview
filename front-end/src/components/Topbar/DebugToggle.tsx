import { useAuth, useDebugMode } from "@/hooks";
import { Box, Switch } from "@mantine/core";

const AMBER = "#F59E0B";
const DEBUG_FONT =
  "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

export function DebugToggle() {
  const { user } = useAuth();
  const { isDebugMode, toggleDebugMode } = useDebugMode();

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        minWidth: 140,
      }}
    >
      <span
        style={{
          fontFamily: DEBUG_FONT,
          fontSize: "0.875rem",
          color: isDebugMode ? AMBER : "#6b7280",
          fontWeight: isDebugMode ? 600 : 400,
        }}
      >
        Debug
      </span>
      <Switch
        checked={isDebugMode}
        onChange={toggleDebugMode}
        size="sm"
        styles={{
          track: {
            backgroundColor: isDebugMode ? AMBER : undefined,
            borderColor: isDebugMode ? AMBER : undefined,
          },
        }}
      />
    </Box>
  );
}
