import { useSyncExternalStore } from 'react';

export function useFormattedDate(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = '—'
): string {
  const optionsStr = JSON.stringify(options);

  const format = (): string => {
    if (!dateInput) return fallback;
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return fallback;
      const parsedOptions = optionsStr
        ? (JSON.parse(optionsStr) as Intl.DateTimeFormatOptions)
        : undefined;
      return new Intl.DateTimeFormat('en-US', parsedOptions).format(date);
    } catch {
      return fallback;
    }
  };

  return useSyncExternalStore(
    () => () => {},
    format,
    () => fallback
  );
}
