import type { Attachment } from 'nodemailer/lib/mailer'
import nodemailer from 'nodemailer'

interface IMeta {
  subject: string
  text?: string
  html?: string
  attachments?: Attachment[]
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor () {
    const user = Bun.env.GMAIL_USER || process.env.GMAIL_USER
    const pass = Bun.env.GMAIL_PASS || process.env.GMAIL_PASS

    if (!user || !pass) {
      throw new Error('GMAIL_USER and GMAIL_PASS environment variables are required')
    }

    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: { user, pass }
    })
  }

  async sendEmail (to: string[], meta: IMeta): Promise<void> {
    if (!to?.length) {
      throw new Error('Recipient email(s) is required')
    }

    const user = Bun.env.GMAIL_USER || process.env.GMAIL_USER

    await this.transporter.sendMail({
      from: `"Alternate" <${user}>`,
      to: to.join(','),
      subject: meta.subject,
      text: meta.text,
      html: meta.html,
      attachments: meta.attachments
    })
  }
}
