import Mailgun from 'mailgun.js'
import { type MessageAttachment, type MailgunMessageData } from 'mailgun.js/definitions'

interface IMeta {
  subject: string
  text?: string
  html?: string
  attachments?: MessageAttachment | MessageAttachment[]
}

export class MailgunService {
  private mg: ReturnType<Mailgun['client']>

  private domain: string

  constructor () {
    const key = Bun.env.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY
    const domain = Bun.env.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN

    if (!key) {
      throw new Error('MAILGUN_API_KEY environment variable is required')
    }
    if (!domain) {
      throw new Error('MAILGUN_DOMAIN environment variable is required')
    }

    this.domain = domain

    const mailgun = new Mailgun(FormData)
    this.mg = mailgun.client({
      username: 'api',
      key
    })
  }

  async sendEmail (to: string[], meta: IMeta): Promise<void> {
    if (!to?.length) {
      throw new Error('Recipient email(s) is required')
    }

    try {
      await this.mg.messages.create(this.domain, {
        from: `Alternate <postmaster@${this.domain}>`,
        to: to.join(','),
        subject: meta.subject,
        text: meta.text,
        html: meta.html,
        ...(meta.attachments && { attachment: meta.attachments })
      } as MailgunMessageData)
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
