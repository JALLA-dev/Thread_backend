/**
 * Health check endpoint — returns app status.
 * Used by deployment platforms and uptime monitors.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    app: "thread",
    timestamp: new Date().toISOString(),
  });
}
