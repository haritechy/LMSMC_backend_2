const { google } = require("googleapis");

/**
 * Build service account from environment variables
 */
const serviceAccount = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
};

if (!serviceAccount.client_email || !serviceAccount.private_key) {
  console.error("❌ Missing Google service account environment variables");
  process.exit(1);
}

const SHARED_EMAIL = process.env.GOOGLE_SHARED_EMAIL || "lms@techfreak.info";

/**
 * Google JWT Auth
 */
const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
  subject: SHARED_EMAIL,
});

const calendar = google.calendar({ version: "v3", auth });

/**
 * Create Google Meet
 */
async function createGoogleMeet(trainer, student, classData, date, time) {
  try {
    await auth.authorize();

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

    const event = {
      summary: `${classData.title} - ${student.name}`,
      description: `Training class with ${student.name} by ${trainer.name}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      attendees: [
        { email: trainer.email },
        { email: student.email },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    return {
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
    };
  } catch (err) {
    console.error("❌ Failed to create Google Meet:", err);
    return { meetLink: null, eventId: null };
  }
}

module.exports = { createGoogleMeet };
