import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using Nodemailer and SMTP configurations defined in environment variables.
 * If SMTP credentials are not configured, it will log a warning to the console and return false.
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (user ? `"PPDB Royal At-Tin" <${user}>` : '');

  if (!user || !pass) {
    console.warn(
      '⚠️ SMTP_USER atau SMTP_PASS belum dikonfigurasi di environment variables. Notifikasi email dilewati.\n' +
      'Silakan tambahkan SMTP_USER dan SMTP_PASS ke file .env Anda untuk mengaktifkan notifikasi email.'
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`✉️ Notifikasi email berhasil dikirim ke ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Gagal mengirim email ke ${to}:`, error.message || error);
    return false;
  }
}
