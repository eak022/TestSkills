/* eslint-disable @typescript-eslint/ban-ts-comment */
export function generateNextIdentifier (
  currentLetter: string,
  sequenceNumber: number
): {
  generatedId: string
  currentLetter: string
  sequenceNumber: number
} {
  const maxNumber = 999
  const alphabet = 'ABCDEFGHIJKLMNPQRSTUVWXYZ' // Skipping 'O', so 25 letters

  let letter = ((currentLetter && currentLetter.trim().toUpperCase()) || 'A')
  let number = sequenceNumber ?? 1

  if (number > maxNumber) {
    number = 1
    letter = nextLetter(letter, alphabet)
  }

  const generatedId = `${letter}${String(number).padStart(3, '0')}`
  return { generatedId, currentLetter: letter, sequenceNumber: number }
}

function nextLetter (curr: string, alphabet: string): string {
  const base = alphabet.length

  const digits = curr.split('').map((ch) => {
    const idx = alphabet.indexOf(ch)
    return idx >= 0 ? idx : 0
  })

  let carry = 1
  for (let i = digits.length - 1; i >= 0 && carry > 0; i--) {
    // @ts-ignore
    digits[i] += carry
    // @ts-ignore
    if (digits[i] >= base) {
      digits[i] = 0
      carry = 1
    } else {
      carry = 0
    }
  }

  if (carry > 0) {
    digits.unshift(0)
  }

  return digits.map((d) => alphabet[d]).join('')
}
