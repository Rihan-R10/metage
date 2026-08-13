import { useState, useEffect } from 'react';

export function useFormattedDate(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = '—'
): string {
  const [formatted, setFormatted] = useState(fallback);

  const optionsStr = JSON.stringify(options);

  useEffect(() => {
    if (!dateInput) {
      setFormatted(fallback);
      return;
    }

    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        setFormatted(fallback);
        return;
      }
      const parsedOptions = optionsStr ? (JSON.parse(optionsStr) as Intl.DateTimeFormatOptions) : undefined;
      setFormatted(new Intl.DateTimeFormat('en-US', parsedOptions).format(date));
    } catch {
      setFormatted(fallback);
    }
  }, [dateInput, optionsStr, fallback]);

  return formatted;
}

