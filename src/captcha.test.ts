import test from 'node:test'
import assert from 'node:assert/strict'

import { generateCaptcha, validateCaptcha } from './captcha'

test('generateCaptcha creates a solvable arithmetic challenge', () => {
  const captcha = generateCaptcha()

  assert.match(captcha.question, /\d+\s*[+\-]\s*\d+/)
  assert.equal(typeof captcha.answer, 'number')
  assert.equal(validateCaptcha(captcha.question, captcha.answer), true)
})

test('validateCaptcha rejects wrong values', () => {
  assert.equal(validateCaptcha('9 + 3', 10), false)
})
