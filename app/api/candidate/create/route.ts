import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendBaseUrl() {
  return (
    process.env.CANDIDATE_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:5000"
  );
}

export async function POST(request: Request) {
  try {
    const incomingFormData = await request.formData();
    const forwardedFormData = new FormData();

    for (const [key, value] of incomingFormData.entries()) {
      forwardedFormData.append(key, value);
    }

    const upstreamResponse = await fetch(
      `${getBackendBaseUrl()}/api/candidate/create`,
      {
        method: "POST",
        body: forwardedFormData,
      }
    );

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? JSON.stringify(await upstreamResponse.json())
      : await upstreamResponse.text();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: {
        "content-type": contentType || "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Proxy submit failed:", error);

    return NextResponse.json(
      {
        message:
          "Could not reach the backend at CANDIDATE_API_BASE_URL (default: http://localhost:5000).",
      },
      { status: 502 }
    );
  }
}
