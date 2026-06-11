import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? "1REwJa64uh0fCMJx5KtHTuvDVYeSYZTKsI6liR3zdaes";
const SHEET_NAME = "Leads";

interface LeadRow {
  storeName: string;
  phone: string;
  province: string;
  foodCategory: string;
  pdpaConsent: boolean;
  interestedWongnaiPos?: boolean;
}

export async function appendLeadToSheet(lead: LeadRow): Promise<void> {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
      console.warn("[GoogleSheets] GOOGLE_SERVICE_ACCOUNT_JSON not set — skipping sheet sync");
      return;
    }

    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const row = [
      now,
      lead.storeName,
      lead.phone,
      lead.province,
      lead.foodCategory,
      lead.pdpaConsent ? "ยินยอม" : "ไม่ยินยอม",
      lead.interestedWongnaiPos ? "✅ สนใจ" : "❌ ไม่สนใจ",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`[GoogleSheets] Lead appended: ${lead.storeName} (${lead.phone})`);
  } catch (error) {
    // Non-fatal: lead is already saved to DB
    console.error("[GoogleSheets] Failed to append lead to sheet:", error);
  }
}
