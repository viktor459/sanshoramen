import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

const PROPERTY_ID = process.env.GA_PROPERTY_ID;

async function gaRequest(body: object) {
  let credentials: any;
  if (process.env.GA_SERVICE_ACCOUNT_B64) {
    credentials = JSON.parse(Buffer.from(process.env.GA_SERVICE_ACCOUNT_B64, "base64").toString("utf-8"));
  } else {
    const rawKey = process.env.GA_PRIVATE_KEY || "";
    const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
    credentials = { client_email: process.env.GA_CLIENT_EMAIL, private_key: privateKey };
  }
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

export async function GET() {
  if (!PROPERTY_ID || !process.env.GA_CLIENT_EMAIL || !process.env.GA_PRIVATE_KEY) {
    return NextResponse.json({ error: "GA not configured" }, { status: 500 });
  }

  try {
    // Test single request first to check for errors
    const testResp = await gaRequest({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      limit: 1,
    });
    if (testResp.error) {
      return NextResponse.json({ error: testResp.error.message || JSON.stringify(testResp.error) }, { status: 400 });
    }

    const [sessions, topPages, sources, devices] = await Promise.all([
      // Sessions + users last 30 days (daily)
      gaRequest({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Top pages
      gaRequest({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      // Traffic sources
      gaRequest({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }),
      // Device category
      gaRequest({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    ]);

    // Totals
    const totalSessions = sessions.rows?.reduce((s: number, r: any) => s + Number(r.metricValues[0].value), 0) || 0;
    const totalUsers = sessions.rows?.reduce((s: number, r: any) => s + Number(r.metricValues[1].value), 0) || 0;

    return NextResponse.json({
      totalSessions,
      totalUsers,
      daily: sessions.rows?.map((r: any) => ({
        date: r.dimensionValues[0].value,
        sessions: Number(r.metricValues[0].value),
        users: Number(r.metricValues[1].value),
      })) || [],
      topPages: topPages.rows?.map((r: any) => ({
        path: r.dimensionValues[0].value,
        views: Number(r.metricValues[0].value),
      })) || [],
      sources: sources.rows?.map((r: any) => ({
        channel: r.dimensionValues[0].value,
        sessions: Number(r.metricValues[0].value),
      })) || [],
      devices: devices.rows?.map((r: any) => ({
        device: r.dimensionValues[0].value,
        sessions: Number(r.metricValues[0].value),
      })) || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
