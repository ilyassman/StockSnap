// utils/formatting.ts

/**
 * Format a number as currency (EUR by default)
 */
export const formatCurrency = (
  value: number,
  locale: string = 'fr-FR',
  currency: string = 'EUR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format a date as a string
 */
export const formatDate = (
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  return new Date(timestamp).toLocaleDateString('fr-FR', options);
};

/**
 * Format a string to be used as a SKU
 * Removes special characters and spaces, converts to uppercase
 */
export const formatSKU = (text: string): string => {
  return text
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-')
    .toUpperCase();
};
