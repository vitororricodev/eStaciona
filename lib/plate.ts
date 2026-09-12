export function normalizePlate(value: string) {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export function isValidBrazilianPlate(value: string) {
  const plate = normalizePlate(value);
  return /^[A-Z]{3}(?:[0-9]{4}|[0-9][A-Z][0-9]{2})$/.test(plate);
}

export function plateFormatHint(value: string) {
  const plate = normalizePlate(value);
  if (!plate) return '';
  if (isValidBrazilianPlate(plate)) return 'Placa válida';
  return 'Use o padrão ABC1234 ou ABC1D23';
}
