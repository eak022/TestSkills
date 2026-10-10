import { type SystemSettingRepository } from '@/repositories/system-setting.repository'
import { type Prisma } from '@prisma/index'

export const KILL_SWITCH_KEY = 'killSwitch'

export class KillSwitchService {
  constructor (
    private readonly systemSettingRepository: SystemSettingRepository
  ) {}

  async isEnabled (): Promise<boolean> {
    const row = await this.systemSettingRepository.findUnique({
      where: { key: KILL_SWITCH_KEY }
    })
    return Boolean((row?.value as { enabled?: boolean } | null)?.enabled)
  }

  async setEnabled (enabled: boolean, actor: string): Promise<{ enabled: boolean }> {
    await this.systemSettingRepository.upsert({
      where: { key: KILL_SWITCH_KEY },
      create: {
        key: KILL_SWITCH_KEY,
        value: { enabled, updatedBy: actor } as Prisma.InputJsonValue
      },
      update: {
        value: { enabled, updatedBy: actor } as Prisma.InputJsonValue
      }
    })
    return { enabled }
  }
}
