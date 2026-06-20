import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/server-config";

const isProtectedRoute = createRouteMatcher([
  "/transactions(.*)",
  "/accounts(.*)",
  "/budgets(.*)",
  "/goals(.*)",
  "/chat(.*)",
  "/api/dashboard(.*)",
  "/api/transactions(.*)",
  "/api/chat(.*)",
]);

const middleware = isClerkConfigured()
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : () => {};

export default middleware;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
