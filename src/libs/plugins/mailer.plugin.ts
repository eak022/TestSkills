import nodemailer from 'nodemailer'

export const mailTransporter = nodemailer.createTransport({
  host: 'gmail',
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_USER || Bun.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS || Bun.env.GMAIL_PASS
  }
})
