export function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatCurrency(value?: number | string | null) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const amount = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatCnpj(value: string) {
  return value.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
    '$1.$2.$3/$4-$5',
  );
}

export function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}
