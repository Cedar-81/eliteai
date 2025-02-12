/*
This retrieves the referrals from all users
*/
export const dynamic = "force-dynamic";
import { google, sheets_v4 } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const keyFileBase64 = process.env.GOOGLE_APP_CRED || "";
  const keyFileBuffer = Buffer.from(keyFileBase64, "base64");
  const keyFile = keyFileBuffer.toString("utf-8");

  const data: {
    referrer: string;
    referrals: Array<{ name: string; date: string }>;
  }[] = [];

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(keyFile),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();

  /*@ts-ignore*/
  const sheets: sheets_v4.Sheets = google.sheets({
    version: "v4",
    auth: authClient,
  });

  try {
    console.log("in here");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID || "",
      range: "Sheet3!A:H",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    const response2 = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID || "",
      range: "Sheet5!A:B",
    });

    const rows2 = response2.data.values;
    if (!rows2 || rows2.length === 0) {
      return console.log("No data found in unpaid sheet");
    }

    rows.slice(1).map((item) => {
      let referrals: Array<{ name: string; date: string }> = [];
      let referree = rows.slice(1).filter((value) => value[7] == item[0]);
      referree.forEach((item) => {
        referrals.push({
          name: item[1],
          date: item[4],
        });
      });
      data.push({
        referrer: item[1],
        referrals,
      });
    });

    rows2.slice(1).map((item) => {
      let referrals: Array<{ name: string; date: string }> = [];
      let referree = rows.slice(1).filter((value) => value[7] == item[0]);
      referree.forEach((item) => {
        referrals.push({
          name: item[1],
          date: item[4],
        });
      });
      data.push({
        referrer: item[1],
        referrals,
      });
    });

    // rows2.slice(1).map()

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving sheet:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
