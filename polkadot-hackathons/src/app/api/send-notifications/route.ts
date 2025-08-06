import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  participantName: string;
  participantEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  isOnline: boolean;
  eventId: string;
}

interface BulkEmailRequest {
  type: 'approval' | 'rejection';
  participants: EmailData[];
  rejectionReason?: string;
}

const createApprovalEmailHtml = (participant: EmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Registration Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #E6007A, #552BBF); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Registration Approved!</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
    <h2 style="color: #E6007A; margin-top: 0;">Hi ${participant.participantName}!</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your registration for <strong>${participant.eventName}</strong> has been approved.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #E6007A;">
      <h3 style="margin-top: 0; color: #333;">Event Details:</h3>
      <p><strong>📅 Date:</strong> ${participant.eventDate}</p>
      <p><strong>📍 Location:</strong> ${participant.isOnline ? 'Online Event' : participant.eventLocation}</p>
      <p><strong>🎯 Event:</strong> ${participant.eventName}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://polkarena.montaq.org/events/${participant.eventId}" 
       style="background: #E6007A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      View Event Details
    </a>
  </div>
  
  <div style="background: #f1f3f4; padding: 20px; border-radius: 6px; font-size: 14px; color: #666;">
    <p style="margin: 0;"><strong>What's Next?</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Add the event to your calendar</li>
      <li>Check your email for any pre-event materials</li>
      <li>Join our Discord if available for updates</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
    <p>This email was sent from PolkaRena Event Platform</p>
    <p>If you have any questions, please contact the event organizer.</p>
  </div>
</body>
</html>
`;

const createRejectionEmailHtml = (participant: EmailData, reason: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Registration Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #666, #333); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Registration Update</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${participant.participantName},</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for your interest in <strong>${participant.eventName}</strong>. 
      Unfortunately, we are unable to approve your registration at this time.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #dc3545;">
      <h3 style="margin-top: 0; color: #333;">Reason:</h3>
      <p style="color: #666;">${reason}</p>
    </div>
  </div>
  
  <div style="background: #f1f3f4; padding: 20px; border-radius: 6px; font-size: 14px; color: #666;">
    <p style="margin: 0;"><strong>Don't worry!</strong></p>
    <p style="margin: 10px 0;">
      • Check out our other upcoming events<br>
      • Follow us for future opportunities<br>
      • Contact the organizer if you have questions
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://polkarena.montaq.org/events" 
       style="background: #666; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Browse Other Events
    </a>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
    <p>This email was sent from PolkaRena Event Platform</p>
    <p>If you have any questions, please contact the event organizer.</p>
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const body: BulkEmailRequest = await request.json();
    const { type, participants, rejectionReason } = body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants provided' },
        { status: 400 }
      );
    }

    const emailPromises = participants.map(async (participant) => {
      try {
        const isApproval = type === 'approval';
        const subject = isApproval 
          ? `🎉 Registration Approved: ${participant.eventName}`
          : `Registration Update: ${participant.eventName}`;
        
        const html = isApproval 
          ? createApprovalEmailHtml(participant)
          : createRejectionEmailHtml(participant, rejectionReason || 'No specific reason provided');

        const result = await resend.emails.send({
          from: 'PolkaRena Events <onboarding@resend.dev>',
          to: [participant.participantEmail],
          subject,
          html,
          // Optional: Schedule email to be sent immediately
          // scheduledAt: new Date(),
        });

        return {
          email: participant.participantEmail,
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        console.error(`Failed to send email to ${participant.participantEmail}:`, error);
        return {
          email: participant.participantEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Email notifications sent: ${successful} successful, ${failed} failed`,
      successful,
      failed,
      results,
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email notifications' },
      { status: 500 }
    );
  }
} 