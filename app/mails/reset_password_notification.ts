import { BaseMail } from "@adonisjs/mail";

import env from "#start/env";

export default class ResetPasswordNotification extends BaseMail {
  from = env.get("SMTP_USERNAME");
  subject = "Reset email";
  url: string;

  constructor(email: string, url: string) {
    super();
    this.message.to(email);
    this.url = url;
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.html(`
      <html>
        <body style="font-family: sans-serif;">
          <p>We received a request to reset your password for your account.</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${this.url}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        </body>
      </html>
      `);
  }
}
