import { Global, Injectable, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly transporter: Transporter | null;

  constructor(config: ConfigService) {
    this.from = config.get<string>("MAIL_FROM") ?? "Gawula <no-reply@gawula.co.za>";
    const host = config.get<string>("MAIL_HOST");
    const port = Number(config.get<string>("MAIL_PORT") ?? 1025);
    const user = config.get<string>("MAIL_USER");
    const pass = config.get<string>("MAIL_PASS");
    const secure = config.get<string>("MAIL_SECURE") === "true";

    this.transporter = host
      ? createTransport({
          host,
          port,
          secure,
          auth: user && pass ? { user, pass } : undefined,
        })
      : null;
  }

  async send(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `MAIL_HOST not configured. Skipped email to ${options.to}: ${options.subject}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
      );
    }
  }
}

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

export { MailService };
