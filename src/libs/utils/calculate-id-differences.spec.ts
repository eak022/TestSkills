import { describe, expect, it } from 'bun:test'
import { calculateIdDifferences } from './calculate-id-differences.util'

describe('calculateIdDifferences', () => {
  it('should return the correct IDs to add and remove', () => {
    const existingIds = [1, 2, 3]
    const newIds = [2, 3, 4]

    const result = calculateIdDifferences(existingIds, newIds)

    expect(result.idsToAdd).toEqual([4])
    expect(result.idsToRemove).toEqual([1])
  })
})
