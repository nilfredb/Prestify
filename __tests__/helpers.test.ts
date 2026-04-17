import { formatCurrency, formatDate } from '../utils/helpers';

describe('utils/helpers', () => {
  it('formatea moneda en DOP', () => {
    const result = formatCurrency(1500);

    expect(result).toContain('DOP');
    expect(result).toContain('1500');
  });

  it('formatea fecha', () => {
    const result = formatDate(new Date('2026-04-17'));

    expect(result).toContain('abr');
    expect(result).toContain('2026');
  });
});