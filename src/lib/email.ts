/**
 * Email Service
 * Handles sending emails via Resend or console logging in development
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Send email or log to console if Resend is not configured
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log('\n📧 Email (Console Mode - Resend not configured):');
    console.log('─'.repeat(60));
    console.log(`To: ${to}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log('─'.repeat(60));
    console.log(html);
    console.log('─'.repeat(60));
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send user deactivated notification email
 */
export async function sendUserDeactivatedEmail(
  email: string,
  fullName: string
) {
  const subject = 'Account Deactivated';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Account Deactivated</h1>
          </div>
          <div class="content">
            <p>Hello ${fullName},</p>
            <p>Your account has been deactivated by an administrator.</p>
            <p>You will no longer be able to access your account or place orders.</p>
            <p>If you believe this is a mistake, please contact our support team.</p>
            <p>Best regards,<br>E-Commerce Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
}

/**
 * Send user reactivated notification email
 */
export async function sendUserReactivatedEmail(
  email: string,
  fullName: string
) {
  const subject = 'Account Reactivated';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome Back!</h1>
          </div>
          <div class="content">
            <p>Hello ${fullName},</p>
            <p>Great news! Your account has been reactivated.</p>
            <p>You can now log in and continue using all features of our platform.</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">
              Log In Now
            </a>
            <p>Best regards,<br>E-Commerce Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
}
