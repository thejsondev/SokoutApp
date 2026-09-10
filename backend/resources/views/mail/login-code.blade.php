<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Dein Anmeldecode für Sokout</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #eeeeee;">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#737373;font-weight:600;">Sokout</p>
              <h1 style="margin:10px 0 0 0;font-size:26px;line-height:1.25;font-weight:700;color:#111111;">Dein Anmeldecode</h1>
              <p style="margin:12px 0 0 0;font-size:16px;line-height:1.5;color:#525252;">
                Hallo,<br>
                mit diesem Code kannst du dich bei Sokout anmelden. Gib ihn in der App ein — er ist nur für dich bestimmt.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:22px;">
                <tr>
                  <td align="center" style="padding:28px 16px;">
                    <p style="margin:0 0 10px 0;font-size:13px;color:#737373;">Anmeldecode</p>
                    <p style="margin:0;font-size:36px;line-height:1;letter-spacing:0.28em;font-weight:700;color:#111111;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                      {{ $code }}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 8px 28px;">
              <p style="margin:0;font-size:15px;line-height:1.55;color:#525252;">
                Der Code ist <strong style="color:#111111;">10 Minuten</strong> gültig
                @if($expiresAt)
                  (bis {{ $expiresAt->timezone('Europe/Berlin')->format('H:i') }} Uhr)
                @endif
                und kann nur einmal verwendet werden.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 28px 28px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#737373;">
                Falls du diesen Code nicht angefordert hast, ignoriere diese E-Mail. Dein Konto bleibt unverändert.
              </p>
              <p style="margin:18px 0 0 0;font-size:14px;line-height:1.55;color:#525252;">
                Viele Grüße<br>
                <strong style="color:#111111;">Dein Sokout-Team</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;font-size:12px;line-height:1.5;color:#a3a3a3;max-width:520px;">
          Diese Nachricht wurde automatisch von {{ $appName }} gesendet.
          @if(!empty($appUrl))
            <br><a href="{{ $appUrl }}" style="color:#737373;text-decoration:underline;">{{ $appUrl }}</a>
          @endif
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
