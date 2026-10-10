import { prisma } from '@prisma/index'
import type { PrismaTransactionalClient } from '../types/prisma-transaction-client.type'
import { generateNextIdentifier } from './generate-next-identifier.util'

export async function findAndCountIncrease (name: string, increment = 1, prefix?: string) {
  const countData = await prisma.count.findFirst({
    where: {
      name,
      prefix: prefix || null
    }
  })
  if (countData) {
    const countTable = await prisma.count.update({
      where: {
        id: countData.id
      },
      data: {
        count: {
          increment
        }
      }
    })
    return countTable
  } else {
    const countTable = await prisma.count.create({
      data: {
        name,
        count: increment,
        prefix: prefix || null
      }
    })
    return countTable
  }
}

export async function findAndCountIncreaseWithTransaction (
  name: string,
  tx: PrismaTransactionalClient,
  prefix?: string,
  increment = 1
) {
  const countData = await tx.count.findFirst({
    where: {
      name,
      prefix: prefix || null
    }
  })

  if (countData) {
    const result = await tx.count.update({
      where: {
        id: countData.id
      },
      data: {
        count: {
          increment
        }
      }
    })
    return result
  } else {
    const result = await tx.count.create({
      data: {
        name,
        count: increment,
        prefix: prefix || null
      }
    })
    return result
  }
}

export async function findAndCountPrefixIncrease (
  name: string,
  prefix?: string
): Promise<string> {
  const counterRecord = await prisma.count.findFirst({
    where: {
      name,
      prefix: prefix || null
    }
  })

  const defaultId = 'A001'

  if (counterRecord) {
    const { generatedId, currentLetter, sequenceNumber } = generateNextIdentifier(
      counterRecord.alphabet || 'A',
      counterRecord.count + 1
    )

    await prisma.count.update({
      where: { id: counterRecord.id },
      data: {
        alphabet: currentLetter,
        count: sequenceNumber
      }
    })

    return generatedId
  } else {
    await prisma.count.create({
      data: {
        name,
        count: 1,
        prefix: prefix || null,
        alphabet: 'A'
      }
    })

    return defaultId
  }
}

export async function findAndCountPrefixIncreaseWithTransaction (
  name: string,
  tx: PrismaTransactionalClient,
  prefix?: string
): Promise<string> {
  const counterRecord = await tx.count.findFirst({
    where: {
      name,
      prefix: prefix || null
    }
  })

  const defaultId = 'A001'

  if (counterRecord) {
    const { generatedId, currentLetter, sequenceNumber } = generateNextIdentifier(
      counterRecord.alphabet || 'A',
      counterRecord.count + 1
    )

    await tx.count.update({
      where: { id: counterRecord.id },
      data: {
        alphabet: currentLetter,
        count: sequenceNumber
      }
    })

    return generatedId
  } else {
    await tx.count.create({
      data: {
        name,
        count: 1,
        prefix: prefix || null,
        alphabet: 'A'
      }
    })

    return defaultId
  }
}
