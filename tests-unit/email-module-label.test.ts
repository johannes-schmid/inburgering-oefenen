import { describe, it, expect } from 'vitest';
import { moduleLabel } from '@/lib/email/templates/cancellation';

describe('moduleLabel (opzegmail)', () => {
  it('noemt een module met niveau zoals de kandidaat hem kent', () => {
    expect(moduleLabel('a2:lezen')).toBe('Lezen A2');
    expect(moduleLabel('b1:spreken')).toBe('Spreken B1');
  });
  it('noemt KNM en ONA bij hun naam', () => {
    expect(moduleLabel('knm')).toBe('KNM');
    expect(moduleLabel('ona')).toBe('ONA');
  });
  it('valt voor een kale slug terug op de onderdeelnaam', () => {
    expect(moduleLabel('luisteren')).toBe('Luisteren');
  });
});
