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
    // NOTE: the link works using postman or other API testing tool.
    // It needs a json type body of
    // {
    // "password": "actualpassword"
    // }
    this.message.html(`
      <html>
        <body style="font-family: sans-serif;">
          <p>THIS IS AN EMAIL MOCK !!!</>
          <p>The link below is a PUT endpoint. Form page not implemented</p>
          <p><a href="${this.url}">Reset Password</a></p>
        </body>
      </html>
      `);
  }
}
