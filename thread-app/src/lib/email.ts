// Mock Email Service for Development
// In a real application, this would use Resend, SendGrid, or AWS SES.

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  if (process.env.NODE_ENV === 'development') {
    console.log('--------------------------------------------------');
    console.log(`📧 MOCK EMAIL SENT`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${html}`);
    console.log('--------------------------------------------------');
  }
  
  return { success: true };
}

export async function sendBookingConfirmationEmail(guestEmail: string, guestName: string, eventTitle: string, startTime: Date) {
  const timeString = startTime.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return sendEmail({
    to: guestEmail,
    subject: `Confirmed: ${eventTitle} with Thread`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Booking Confirmed</h2>
        <p>Hi ${guestName},</p>
        <p>Your meeting has been scheduled.</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>Event:</strong> ${eventTitle}<br/>
          <strong>Time:</strong> ${timeString}
        </div>
        <p>You can use the links provided in your calendar event to reschedule or cancel if needed.</p>
      </div>
    `,
  });
}

export async function sendBookingCancellationEmail(guestEmail: string, guestName: string, eventTitle: string) {
  return sendEmail({
    to: guestEmail,
    subject: `Cancelled: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Booking Cancelled</h2>
        <p>Hi ${guestName},</p>
        <p>Your meeting for <strong>${eventTitle}</strong> has been cancelled.</p>
      </div>
    `,
  });
}

export async function sendBookingRequestEmail(guestEmail: string, guestName: string, eventTitle: string, startTime: Date) {
  const timeString = startTime.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return sendEmail({
    to: guestEmail,
    subject: `Request Received: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Request Received</h2>
        <p>Hi ${guestName},</p>
        <p>Your request for <strong>${eventTitle}</strong> has been received and is pending approval.</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>Event:</strong> ${eventTitle}<br/>
          <strong>Requested Time:</strong> ${timeString}
        </div>
        <p>You will receive another email once the host approves your request.</p>
      </div>
    `,
  });
}
