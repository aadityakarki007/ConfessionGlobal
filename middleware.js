import { authMiddleware, redirectToSignIn } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in/*"], // these routes are open
  afterAuth(auth, req) {
    // Only protect admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!auth.user || auth.user.publicMetadata.role !== "confess") {
        return redirectToSignIn(); // not allowed → redirect
      }
    }
  },
});

export const config = { matcher: ["/admin/:path*"] }; // only applies to admin paths
