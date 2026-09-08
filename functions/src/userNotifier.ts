import * as nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';

// 메일 발송을 위한 SMTP 설정 (개발 시에는 Gmail 앱 비밀번호 등을 사용하거나, SendGrid/AWS SES 사용 가능)
// 여기서는 기본적으로 환경변수 또는 firebase config를 읽어옵니다.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || functions.config().smtp?.email || 'ilikefeeling@gmail.com',
    pass: process.env.SMTP_PASSWORD || functions.config().smtp?.password || 'dummy-password',
  },
});

export const sendApprovalEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: '"RabTube 관리자" <ilikefeeling@gmail.com>',
    to: email,
    subject: '[RabTube] 정회원 가입 승인 안내',
    html: `
      <div style="font-family: sans-serif; max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg">
        <h2 style="color: #0d9488;">안녕하세요, ${name} 원장님!</h2>
        <p>치과의사 전용 임상 영상 플랫폼 <strong>RabTube</strong>에 오신 것을 환영합니다.</p>
        <p>요청하신 면허증 검토가 완료되어 <strong>정회원으로 최종 승인</strong>되었습니다.</p>
        <p>이제 RabTube의 모든 임상 영상 피드를 자유롭게 이용하실 수 있습니다.</p>
        <br />
        <a href="https://rabtube.com" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">RabTube 시작하기</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Approval email sent to ${email}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send approval email to ${email}:`, error);
  }
};

export const sendRejectionEmail = async (email: string, name: string, reason: string) => {
  const mailOptions = {
    from: '"RabTube 관리자" <ilikefeeling@gmail.com>',
    to: email,
    subject: '[RabTube] 가입 승인 반려 및 면허증 재업로드 안내',
    html: `
      <div style="font-family: sans-serif; max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg">
        <h2>안녕하세요, ${name} 원장님.</h2>
        <p>치과의사 전용 임상 영상 플랫폼 <strong>RabTube</strong> 가입을 신청해 주셔서 감사합니다.</p>
        <p>제출해 주신 면허증 정보를 확인한 결과, 아쉽게도 아래의 사유로 승인이 보류(반려)되었습니다.</p>
        
        <blockquote style="background-color: #fef2f2; padding: 15px; border-left: 5px solid #ef4444; margin: 20px 0; color: #991b1b;">
          <strong>[반려 사유]</strong><br />
          ${reason}
        </blockquote>
        
        <p>정확하고 식별 가능한 면허증 사진(또는 PDF)으로 다시 제출해 주시면 신속히 재검토를 진행하겠습니다.</p>
        <br />
        <a href="https://rabtube.com/dashboard/verify" style="display: inline-block; background-color: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">면허증 재업로드 페이지로 이동</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Rejection email sent to ${email}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send rejection email to ${email}:`, error);
  }
};
