const { google } = require("googleapis");

// ✅ Read everything from ENV
const {
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHARED_EMAIL,
} = process.env;

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHARED_EMAIL) {
  console.error("❌ Missing Google environment variables");
  process.exit(1);
}

// ✅ JWT Auth using ENV
const auth = new google.auth.JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
  subject: GOOGLE_SHARED_EMAIL, // impersonation
});

const calendar = google.calendar({ version: "v3", auth });

// ✅ Create Google Meet
async function createGoogleMeet(trainer, student, classData, date, time) {
  try {
    await auth.authorize();

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

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
    console.error("❌ Google Meet creation failed:", err.message);
    return { meetLink: null, eventId: null };
  }
}

module.exports = { createGoogleMeet };
