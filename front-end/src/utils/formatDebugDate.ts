const formatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDebugDate(
  dateInput: string | null | undefined
): string | null {
  if (dateInput === null || dateInput === undefined) {
    return null;
  }

  const date = new Date(dateInput);
  return formatter.format(date);
}
