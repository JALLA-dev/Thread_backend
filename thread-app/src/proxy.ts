import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  "/",                           // Landing page
  "/sign-in(.*)",               // Clerk sign-in
  "/sign-up(.*)",               // Clerk sign-up
  "/book/(.*)",                 // Public booking pages
  "/api/webhooks/(.*)",         // Webhooks (Clerk, etc.)
  "/api/health",                // Health check endpoint
]);

import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes that are NOT public
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
