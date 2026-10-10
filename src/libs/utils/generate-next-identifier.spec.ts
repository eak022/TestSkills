import { describe, expect, it } from 'bun:test'
import { generateNextIdentifier } from './generate-next-identifier.util'

interface TestCase {
  input: [string, number]
  expected: [string, string, number]
}

describe('generateNextIdentifier', () => {
  describe('normal sequence generation', () => {
    it('should generate correct ID with valid letter and number', () => {
      const result = generateNextIdentifier('A', 1)

      expect(result.generatedId).toBe('A001')
      expect(result.currentLetter).toBe('A')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should handle maximum number within limit', () => {
      const result = generateNextIdentifier('B', 999)

      expect(result.generatedId).toBe('B999')
      expect(result.currentLetter).toBe('B')
      expect(result.sequenceNumber).toBe(999)
    })

    it('should pad numbers correctly', () => {
      const result = generateNextIdentifier('C', 42)

      expect(result.generatedId).toBe('C042')
      expect(result.currentLetter).toBe('C')
      expect(result.sequenceNumber).toBe(42)
    })
  })

  describe('single letter progression', () => {
    it('should progress from A to B when number exceeds 999', () => {
      const result = generateNextIdentifier('A', 1000)

      expect(result.generatedId).toBe('B001')
      expect(result.currentLetter).toBe('B')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress through middle letters correctly', () => {
      const result = generateNextIdentifier('M', 1000)

      expect(result.generatedId).toBe('N001')
      expect(result.currentLetter).toBe('N')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should skip letter O and go to P', () => {
      const result = generateNextIdentifier('N', 1000)

      expect(result.generatedId).toBe('P001')
      expect(result.currentLetter).toBe('P')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from Z to AA', () => {
      const result = generateNextIdentifier('Z', 1000)

      expect(result.generatedId).toBe('AA001')
      expect(result.currentLetter).toBe('AA')
      expect(result.sequenceNumber).toBe(1)
    })
  })

  describe('double letter progression', () => {
    it('should progress from AA to AB', () => {
      const result = generateNextIdentifier('AA', 1000)

      expect(result.generatedId).toBe('AB001')
      expect(result.currentLetter).toBe('AB')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from AB to AC', () => {
      const result = generateNextIdentifier('AB', 1000)

      expect(result.generatedId).toBe('AC001')
      expect(result.currentLetter).toBe('AC')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should skip O in second position (AN to AP)', () => {
      const result = generateNextIdentifier('AN', 1000)

      expect(result.generatedId).toBe('AP001')
      expect(result.currentLetter).toBe('AP')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from AZ to BA', () => {
      const result = generateNextIdentifier('AZ', 1000)

      expect(result.generatedId).toBe('BA001')
      expect(result.currentLetter).toBe('BA')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from ZY to ZZ', () => {
      const result = generateNextIdentifier('ZY', 1000)

      expect(result.generatedId).toBe('ZZ001')
      expect(result.currentLetter).toBe('ZZ')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from ZZ to AAA', () => {
      const result = generateNextIdentifier('ZZ', 1000)

      expect(result.generatedId).toBe('AAA001')
      expect(result.currentLetter).toBe('AAA')
      expect(result.sequenceNumber).toBe(1)
    })
  })

  describe('triple letter progression', () => {
    it('should progress from AAA to AAB', () => {
      const result = generateNextIdentifier('AAA', 1000)

      expect(result.generatedId).toBe('AAB001')
      expect(result.currentLetter).toBe('AAB')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from AAZ to ABA', () => {
      const result = generateNextIdentifier('AAZ', 1000)

      expect(result.generatedId).toBe('ABA001')
      expect(result.currentLetter).toBe('ABA')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from AZZ to BAA', () => {
      const result = generateNextIdentifier('AZZ', 1000)

      expect(result.generatedId).toBe('BAA001')
      expect(result.currentLetter).toBe('BAA')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should progress from ZZZ to AAAA', () => {
      const result = generateNextIdentifier('ZZZ', 1000)

      expect(result.generatedId).toBe('AAAA001')
      expect(result.currentLetter).toBe('AAAA')
      expect(result.sequenceNumber).toBe(1)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined currentLetter', () => {
      // @ts-ignore - testing runtime behavior
      const result = generateNextIdentifier(null, 5)

      expect(result.generatedId).toBe('A005')
      expect(result.currentLetter).toBe('A')
      expect(result.sequenceNumber).toBe(5)
    })

    it('should handle undefined sequenceNumber by defaulting to 1', () => {
      // @ts-ignore - testing runtime behavior
      const result = generateNextIdentifier('B', undefined)

      expect(result.generatedId).toBe('B001')
      expect(result.currentLetter).toBe('B')
      expect(result.sequenceNumber).toBe(1)
    })

    it('should handle empty string currentLetter', () => {
      const result = generateNextIdentifier('', 10)

      expect(result.generatedId).toBe('A010')
      expect(result.currentLetter).toBe('A')
      expect(result.sequenceNumber).toBe(10)
    })

    it('should handle very large sequence numbers', () => {
      const result = generateNextIdentifier('A', 5000)

      expect(result.generatedId).toBe('B001')
      expect(result.currentLetter).toBe('B')
      expect(result.sequenceNumber).toBe(1)
    })
  })

  describe('comprehensive sequence testing', () => {
    it('should handle a complete sequence simulation', () => {
      const testCases: TestCase[] = [
        { input: ['A', 1000], expected: ['B001', 'B', 1] },
        { input: ['N', 1000], expected: ['P001', 'P', 1] }, // Skip O
        { input: ['Z', 1000], expected: ['AA001', 'AA', 1] },
        { input: ['AA', 1000], expected: ['AB001', 'AB', 1] },
        { input: ['AN', 1000], expected: ['AP001', 'AP', 1] }, // Skip O in second position
        { input: ['AZ', 1000], expected: ['BA001', 'BA', 1] },
        { input: ['ZZ', 1000], expected: ['AAA001', 'AAA', 1] },
        { input: ['AAA', 1000], expected: ['AAB001', 'AAB', 1] },
        { input: ['AAZ', 1000], expected: ['ABA001', 'ABA', 1] },
        { input: ['AZZ', 1000], expected: ['BAA001', 'BAA', 1] },
        { input: ['ZZZ', 1000], expected: ['AAAA001', 'AAAA', 1] }
      ]

      testCases.forEach(({ input, expected }) => {
        const [letter, number] = input
        const [expectedId, expectedLetter, expectedNumber] = expected
        const result = generateNextIdentifier(letter as string, number as number)

        expect(result.generatedId).toBe(expectedId)
        expect(result.currentLetter).toBe(expectedLetter)
        expect(result.sequenceNumber).toBe(expectedNumber)
      })
    })
  })

  describe('letter validation', () => {
    it('should handle mixed case letters', () => {
      const result = generateNextIdentifier('b', 10)

      expect(result.generatedId).toBe('B010')
      expect(result.currentLetter).toBe('B')
      expect(result.sequenceNumber).toBe(10)
    })
  })
})
