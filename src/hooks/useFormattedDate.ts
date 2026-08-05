'use client';

import { useEffect, useState } from 'react';

export function useFormattedDate(
  isoString: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallback = '—'
): string {
  const [formatted, setFormatted] = useState(fallback);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    if (!isoString) {
      setFormatted(fallback);
      return;
    }

    setFormatted(
      new Intl.DateTimeFormat('en-US', JSON.parse(optionsKey)).format(
        new Date(isoString)
      )
    );
  }, [isoString, fallback, optionsKey]);

  return formatted;
}
