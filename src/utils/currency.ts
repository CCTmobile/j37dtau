export const formatCurrencyZAR = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'R0.00';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatShortCurrencyZAR = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'R0';
  const abs = Math.abs(amount);
  let formatted = amount.toString();
  if (abs >= 1_000_000_000) formatted = (amount / 1_000_000_000).toFixed(2) + 'B';
  else if (abs >= 1_000_000) formatted = (amount / 1_000_000).toFixed(2) + 'M';
  else if (abs >= 1_000) formatted = (amount / 1_000).toFixed(1) + 'K';
  return 'R' + formatted;
};
