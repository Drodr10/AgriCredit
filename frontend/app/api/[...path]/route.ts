import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = new URL(request.url);
  // Strip the leading /api prefix to build the upstream path
  const upstreamPath = pathname.replace(/^\/api/, "") || "/";
  const upstreamUrl = `${BACKEND_URL}${upstreamPath}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("authorization"); // Ensure no stray clerk tokens are passed through

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
