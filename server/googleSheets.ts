/**
 * Google Sheets integration via GWS service account proxy
 * Appends new lead rows to the designated spreadsheet in real-time.
 */

const SPREADSHEET_ID = "1REwJa64uh0fCMJx5KtHTuvDVYeSYZTKsI6liR3zdaes";
const SHEET_NAME = "Leads";

// GWS proxy base URL — uses the same auth token as the gws CLI
const GWS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

interface LeadRow {
  storeName: string;
  phone: string;
  province: string;
  foodCategory: string;
  pdpaConsent: boolean;
}

/**
 * Append a new lead row to the Google Sheet.
 * Uses the built-in GWS credential proxy so no extra API key is needed.
 */
export async function appendLeadToSheet(lead: LeadRow): Promise<void> {
  try {
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
    ];

    // Use gws CLI via child_process to append the row
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    const body = JSON.stringify({
      values: [row],
    });

    await execFileAsync("gws", [
      "sheets",
      "spreadsheets",
      "values",
      "append",
      "--params",
      JSON.stringify({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:F`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
      }),
      "--json",
      body,
    ]);

    console.log(`[GoogleSheets] Lead appended: ${lead.storeName} (${lead.phone})`);
  } catch (error) {
    // Non-fatal: log and continue — lead is already saved to DB
    console.error("[GoogleSheets] Failed to append lead to sheet:", error);
  }
}
