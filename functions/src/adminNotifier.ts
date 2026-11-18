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

export interface PendingReviewUserInfo {
  uid: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  hospital?: string;
  region?: string;
  licenseNumber?: string;
  licenseUrl?: string;
}

/**
 * 정회원 가입 신청(면허증 인증 제출로 대기중 상태 전환) 시 최고관리자에게 알림 메일을 전송합니다.
 * @param info 신청 회원의 정보 (이메일, UID, 이름, 병원명, 지역, 면허번호, 면허증 이미지 URL 등)
 */
export const sendPendingReviewAdminAlert = async (info: PendingReviewUserInfo) => {
  if (!SMTP_EMAIL || !SMTP_PASSWORD || !ADMIN_EMAIL) {
    console.warn('[AdminNotifier] SMTP 또는 관리자 이메일 환경변수가 설정되지 않아 메일을 발송할 수 없습니다.');
    return;
  }

  const userIdentifier = info.name ? `${info.name} (${info.email || info.uid})` : (info.email || info.uid);
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const mailOptions = {
    from: `"Rabtube 알림" <${SMTP_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `[Rabtube] 📋 정회원 가입 승인 요청 (대기중) - ${userIdentifier}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0d9488; margin-top: 0; margin-bottom: 8px;">정회원 가입 신청이 접수되었습니다</h2>
        <p style="margin-top: 0; color: #475569; font-size: 15px;">신규 회원의 면허증 및 인적사항 검토 대기(pending) 건이 발생했습니다.<br/>관리자 페이지에서 확인 후 승인 또는 반려를 진행해 주세요.</p>
        
        <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #edf2f7;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">신청 회원 정보</h3>
          <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 14px; color: #334155;">
            <li style="margin-bottom: 8px;"><strong>성명:</strong> ${info.name || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>이메일:</strong> ${info.email || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>연락처:</strong> ${info.phoneNumber || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>소속 병원:</strong> ${info.hospital || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>지역:</strong> ${info.region || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>면허번호:</strong> ${info.licenseNumber || '미입력'}</li>
            <li style="margin-bottom: 8px;"><strong>유저 UID:</strong> ${info.uid}</li>
            <li style="margin-bottom: 8px;"><strong>신청 일시:</strong> ${now} (KST)</li>
            ${info.licenseUrl ? `<li style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1;"><a href="${info.licenseUrl}" target="_blank" style="display: inline-block; color: #0d9488; text-decoration: underline; font-weight: bold;">📄 제출된 면허증 확인하기 &rarr;</a></li>` : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="https://rabtube.com/admin/users" target="_blank" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">관리자 페이지에서 심사하기</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">본 메일은 Rabtube 관리자 알림 시스템에서 자동으로 발송되었습니다.</p>
      </div>
    `,
  };

  try {
    const infoRes = await transporter.sendMail(mailOptions);
    console.log(`[AdminNotifier] 회원가입 심사 대기(pending) 알림 메일 전송 성공: ${infoRes.messageId}`);
  } catch (error) {
    console.error('[AdminNotifier] 회원가입 심사 대기(pending) 알림 메일 전송 실패:', error);
  }
};
