import { escapeHtml } from "./template-utils.js";

type PasswordResetTemplateInput = {
  name: string;
  resetUrl: string;
};

export function getPasswordResetTemplate(input: PasswordResetTemplateInput) {
  const safeName = escapeHtml(input.name);
  const safeResetUrl = escapeHtml(input.resetUrl);

  return {
    subject: "Reset your Worknoon password",
    text: `Hi ${input.name},\n\nUse this link to reset your Worknoon password: ${input.resetUrl}\n\nThis link expires in 30 minutes. If you did not request it, you can ignore this email.`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your password</title>
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
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.4px;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.6;">Hi ${safeName}, we received a request to reset your Worknoon password. Click the button below to choose a new one. This link expires in 30 minutes.</p>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:6px;background-color:#0f766e;">
                    <a href="${safeResetUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">Reset password</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#888888;line-height:1.6;">If the button does not work, copy and paste this URL into your browser:</p>
              <p style="margin:0 0 28px;font-size:13px;color:#555555;word-break:break-all;line-height:1.6;"><a href="${safeResetUrl}" style="color:#0f766e;text-decoration:none;">${safeResetUrl}</a></p>

              <p style="margin:0;font-size:14px;color:#888888;line-height:1.6;">If you did not request a password reset, no action is needed. Your account remains secure.</p>
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
