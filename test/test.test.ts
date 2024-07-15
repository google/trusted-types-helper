// Hey look, import statements work!
import {x} from './util';

// Hey look, TypeScript annotations work!
const sum = (a : number, b) => a + b;

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(x);
});