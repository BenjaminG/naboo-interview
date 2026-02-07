import { Alert } from "@mantine/core";

interface ServiceErrorAlertProps {
  show?: boolean;
}

export function ServiceErrorAlert({ show }: ServiceErrorAlertProps) {
  if (!show) return null;

  return (
    <Alert color="red" mb="md">
      Le service est temporairement indisponible. Veuillez réessayer plus tard.
    </Alert>
  );
}
