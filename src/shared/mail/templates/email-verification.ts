import { escapeHtml } from "./template-utils.js";

type EmailVerificationTemplateInput = {
  name: string;
  code: string;
};

export function getEmailVerificationTemplate(input: EmailVerificationTemplateInput) {
  const safeName = escapeHtml(input.name);
  const safeCode = escapeHtml(input.code);

  return {
    subject: "Verify your Worknoon email",
    text: `Hi ${input.name},\n\nYour Worknoon verification code is ${input.code}. It expires in 15 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background-color:#ffffff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">

          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
              <span style="font-size:18px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Worknoon</span>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.4px;">Verify your email</p>
              <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.6;">Hi ${safeName}, use the code below to complete your sign-up. It is valid for 15 minutes.</p>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#f0fdf9;border:1px solid #99d6ce;border-radius:6px;padding:20px 32px;text-align:center;">
                    <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#0f766e;font-variant-numeric:tabular-nums;">${safeCode}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888888;line-height:1.6;">If you did not create a Worknoon account, you can safely ignore this email.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;background-color:#fafafa;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">Worknoon &middot; This is an automated message, please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}
