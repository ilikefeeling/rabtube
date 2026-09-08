import * as nodemailer from 'nodemailer';

// 환경 변수에서 SMTP 설정 및 관리자 이메일 주소를 가져옵니다.
// Firebase Functions 배포 시 .env 파일에 아래 변수들을 설정해야 합니다.
const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// Nodemailer 트랜스포터 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

/**
 * 신규 회원가입 발생 시 관리자에게 알림 메일을 전송합니다.
 * @param userEmail 새로 가입한 유저의 이메일
 * @param uid 새로 가입한 유저의 UID
 * @param displayName 새로 가입한 유저의 이름 (선택)
 */
export const sendNewUserAdminAlert = async (
  userEmail: string | undefined,
  uid: string,
  displayName?: string
) => {
  if (!SMTP_EMAIL || !SMTP_PASSWORD || !ADMIN_EMAIL) {
    console.warn('[AdminNotifier] SMTP 또는 관리자 이메일 환경변수가 설정되지 않아 메일을 발송할 수 없습니다.');
    return;
  }

  const userIdentifier = displayName ? `${displayName} (${userEmail})` : (userEmail || uid);
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const mailOptions = {
    from: `"Rabtube 알림" <${SMTP_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `[Rabtube] 🎉 신규 회원가입 알림 (${userIdentifier})`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <h2 style="color: #0f766e;">새로운 유저가 Rabtube에 가입했습니다!</h2>
        <p>방금 Rabtube 플랫폼에 새로운 회원이 가입했습니다. 환영해 주세요!</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>가입자 이메일:</strong> ${userEmail || '이메일 없음'}</li>
            <li style="margin-bottom: 8px;"><strong>표시 이름:</strong> ${displayName || '이름 없음'}</li>
            <li style="margin-bottom: 8px;"><strong>유저 UID:</strong> ${uid}</li>
            <li><strong>가입 일시:</strong> ${now} (KST)</li>
          </ul>
        </div>
        <p style="font-size: 13px; color: #64748b;">본 메일은 Rabtube 시스템에서 자동으로 발송되었습니다.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[AdminNotifier] 신규 회원가입 알림 메일 전송 성공: ${info.messageId}`);
  } catch (error) {
    console.error('[AdminNotifier] 신규 회원가입 알림 메일 전송 실패:', error);
  }
};
