import { Elysia } from 'elysia'
import { UnauthorizedError } from '../middlewares/error-handler/domain'
import { hashApiKey } from '../utils/api-key.util'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'

const botAgentRepository = new BotAgentRepository()

export const BOT_KEY_HEADER = 'x-bot-key'

// บอทยืนยันตัวด้วยคีย์ต่อเครื่อง — botId ได้จากคีย์ ไม่ใช่จาก body
export const BotAuthGuard = new Elysia({ name: 'BotAuthMacro' })
  .macro({
    botAuth: {
      async resolve ({ request: { headers } }) {
        const key = headers.get(BOT_KEY_HEADER)
        if (!key) {
          throw new UnauthorizedError(`Missing ${BOT_KEY_HEADER} header`)
        }

        const bot = await botAgentRepository.findFirst({
          where: { apiKeyHash: hashApiKey(key) },
          select: { id: true }
        })
        if (!bot) {
          throw new UnauthorizedError('Invalid or revoked bot key')
        }

        return { bot: { id: bot.id } }
      }
    }
  })
