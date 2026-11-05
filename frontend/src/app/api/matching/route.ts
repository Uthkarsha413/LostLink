
import { NextRequest, NextResponse } from "next/server";

// Existing hybrid matching — GET /api/matching?reportId=...
export async function GET(request: NextRequest) {
  try {
    const reportId = request.nextUrl.searchParams.get("reportId");

    if (!reportId || !/^[1-9]\d*$/.test(reportId)) {
      return NextResponse.json(
        { success: false, error: "Valid report ID is required." },
        { status: 400 }
      );
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (!aiServiceUrl) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${aiServiceUrl}/matching/report/${reportId}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("LostLink matching API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to connect to AI matching service." },
      { status: 502 }
    );
  }
}

// New CLIP text-to-image search — POST /api/matching
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const queryText = body.query_text;
    const targetReportType = body.target_report_type ?? "FOUND";
    const limit = body.limit ?? 5;

    if (
      typeof queryText !== "string" ||
      queryText.trim().length < 2 ||
      queryText.length > 500
    ) {
      return NextResponse.json(
        { success: false, error: "Enter a valid search description." },
        { status: 400 }
      );
    }

    if (!["LOST", "FOUND"].includes(targetReportType)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: "Limit must be between 1 and 50." },
        { status: 400 }
      );
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (!aiServiceUrl) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(`${aiServiceUrl}/clip/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_text: queryText.trim(),
        target_report_type: targetReportType,
        limit,
        exclude_report_id: body.exclude_report_id ?? null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("LostLink CLIP search API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to connect to CLIP search service." },
      { status: 502 }
    );
  }
}
