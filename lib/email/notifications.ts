import { Resend } from 'resend';

// Lazy initialization to avoid errors during build
let resend: Resend | null = null;
function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ProofStack <notifications@proofstack.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://proofstack.com';

export async function sendNewMessageEmail(to: string, data: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationId: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New message from ${data.senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💬 New Message</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">
                Hi ${data.recipientName},
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                <strong>${data.senderName}</strong> sent you a message on ProofStack:
              </p>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <p style="color: #6b7280; font-style: italic; margin: 0;">
                  "${data.messagePreview}"
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/employer/messages?conversation=${data.conversationId}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reply to Message
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #9ca3af; text-align: center;">
                You're receiving this email because you have an account on ProofStack.
                <br>
                <a href="${SITE_URL}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage notification preferences</a>
              </p>
            </div>
          </body>
        </html>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send new message email:', error);
    return { success: false, error };
  }
}

export async function sendNewReviewEmail(to: string, data: {
  professionalName: string;
  employerName: string;
  rating: number;
  reviewPreview: string;
  professionalUsername: string;
}) {
  const stars = '⭐'.repeat(data.rating);
  
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${data.employerName} left you a ${data.rating}-star review`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⭐ New Review</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">
                Hi ${data.professionalName},
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                Great news! <strong>${data.employerName}</strong> just left you a review on ProofStack.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 36px; margin-bottom: 10px;">
                  ${stars}
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #374151;">
                  ${data.rating} out of 5 stars
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
                <p style="color: #6b7280; font-style: italic; margin: 0;">
                  "${data.reviewPreview}"
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/portfolio/${data.professionalUsername}#reviews" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Full Review
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #9ca3af; text-align: center;">
                Reviews help you build credibility and attract more opportunities.
                <br>
                <a href="${SITE_URL}/settings/notifications" style="color: #f59e0b; text-decoration: none;">Manage notification preferences</a>
              </p>
            </div>
          </body>
        </html>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send new review email:', error);
    return { success: false, error };
  }
}

export async function sendPromotionExpiringEmail(to: string, data: {
  professionalName: string;
  tier: string;
  expiresAt: string;
  daysRemaining: number;
}) {
  const tierInfo: Record<string, { name: string; emoji: string }> = {
    featured: { name: 'Featured', emoji: '⭐' },
    premium: { name: 'Premium', emoji: '💎' },
    standard: { name: 'Standard', emoji: '🚀' }
  };
  
  const info = tierInfo[data.tier] || tierInfo.standard;
  
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your ${info.name} promotion expires in ${data.daysRemaining} days`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${info.emoji} Promotion Expiring Soon</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">
                Hi ${data.professionalName},
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                Your <strong>${info.name} Promotion</strong> will expire in <strong>${data.daysRemaining} days</strong> on ${new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
              
              <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
                <p style="color: #92400e; margin: 0; font-weight: 600;">
                  ⚠️ Your profile will return to organic search results after this date.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151;">
                Keep your visibility boost active and continue getting discovered by top employers.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/professional/promote/manage" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Renew Promotion
                </a>
                <a href="${SITE_URL}/professional/promote" 
                   style="display: inline-block; background: transparent; color: #3b82f6; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 2px solid #3b82f6;">
                  View Plans
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #9ca3af; text-align: center;">
                Your promotion will automatically renew unless you cancel.
                <br>
                <a href="${SITE_URL}/professional/promote/manage" style="color: #3b82f6; text-decoration: none;">Manage subscription</a>
              </p>
            </div>
          </body>
        </html>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send promotion expiring email:', error);
    return { success: false, error };
  }
}

export async function sendSecurityAlertEmail(tos: string[] | string, data: {
  sampleId: string
  analysisId?: string
  secrets: Array<{ type: string; severity: string; match: string; position: number }>
  professionalId?: string
  ownerEmail?: string
}) {
  try {
    const recipients = Array.isArray(tos) ? tos : [tos]
    const secretTypes = [...new Set(data.secrets.map(s => s.type))].join(', ')
    const detailsHtml = data.secrets.map(s => `<li><strong>${s.type}</strong> (${s.severity}) — match: ${s.match}</li>`).join('')
    const subject = `Security alert: potential secrets detected in sample ${data.sampleId}`

    for (const to of recipients) {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: `
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111;">
              <h2>Security alert: potential secrets detected</h2>
              <p>Sample ID: <code>${data.sampleId}</code></p>
              ${data.analysisId ? `<p>Analysis ID: <code>${data.analysisId}</code></p>` : ''}
              ${data.professionalId ? `<p>Professional ID: <code>${data.professionalId}</code></p>` : ''}
              ${data.ownerEmail ? `<p>Uploader: ${data.ownerEmail}</p>` : ''}
              <p>Detected secret types: <strong>${secretTypes}</strong></p>
              <ul>${detailsHtml}</ul>
              <p>Please review the sample and contact the uploader to remove any sensitive credentials. You can view the sample in the admin dashboard.</p>
              <p><a href="${SITE_URL}/admin/samples/${data.sampleId}">Open sample in admin</a></p>
            </body>
          </html>
        `
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send security alert email:', error)
    return { success: false, error }
  }
}
