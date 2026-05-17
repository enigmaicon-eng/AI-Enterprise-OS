import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from './index.js';

test('hello smoke', () => {
  assert.equal(hello('test'), 'hello, test');
  assert.equal(hello(), 'hello, world');
});
