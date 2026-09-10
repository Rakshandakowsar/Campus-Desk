export type CaptchaChallenge = {
  question: string
  answer: number
}

export function generateCaptcha(): CaptchaChallenge {
  const first = Math.floor(Math.random() * 9) + 1
  const second = Math.floor(Math.random() * 9) + 1
  const shouldAdd = Math.random() >= 0.5

  if (shouldAdd) {
    return {
      question: `${first} + ${second}`,
      answer: first + second,
    }
  }

  const larger = Math.max(first, second)
  const smaller = Math.min(first, second)

  return {
    question: `${larger} - ${smaller}`,
    answer: larger - smaller,
  }
}

export function validateCaptcha(question: string, value: number): boolean {
  const trimmed = question.trim()
  if (!trimmed) return false

  const match = trimmed.match(/^\s*(\d+)\s*([+-])\s*(\d+)\s*$/)
  if (!match) return false

  const [, left, operator, right] = match
  const leftValue = Number(left)
  const rightValue = Number(right)

  const expected = operator === '+' ? leftValue + rightValue : leftValue - rightValue
  return Number(value) === expected
}
