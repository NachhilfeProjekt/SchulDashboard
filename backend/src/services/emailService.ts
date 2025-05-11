import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('No SendGrid API key configured. Email not sent:', options);
    return;
  }

  try {
    await sgMail.send(options);
    console.log('Email sent to:', options.to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};