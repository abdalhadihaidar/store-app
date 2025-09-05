import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const SENDPULSE_API_URL = "https://api.sendpulse.com";
const API_USER_ID = process.env.SENDPULSE_USER_ID;
const API_SECRET = process.env.SENDPULSE_SECRET;

/**
 * Get access token from SendPulse
 */
async function getSendPulseToken(): Promise<string> {
  try {
    const response = await axios.post(`${SENDPULSE_API_URL}/oauth/access_token`, {
      grant_type: "client_credentials",
      client_id: API_USER_ID,
      client_secret: API_SECRET,
    });

    return response.data.access_token;
  } catch (error: any) {
    // console.error("❌ Error fetching SendPulse token:", error.message);
    throw new Error("Failed to get SendPulse token");
  }
}

/**
 * Send email using SendPulse SMTP API
 */
export async function sendEmail(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
) {
  try {
    const token = await getSendPulseToken();

    const emailData = {
      email: {
        html: Buffer.from(htmlContent).toString("base64"), // Encode HTML in Base64
        text: "Please enable HTML to view this email content.",
        subject,
        from: {
          name: "Brother Investment Group",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: toEmail, name: toName }],
      },
    };

    const response = await axios.post(`${SENDPULSE_API_URL}/smtp/emails`, emailData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // console.log("✅ Email sent successfully:", response.data);
    return response.data;
  } catch (error: any) {
    // console.error("❌ Email sending error:", error.message);
    throw new Error("Failed to send email: " + error.message);
  }
}
