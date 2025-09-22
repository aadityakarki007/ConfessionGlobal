import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
  publicRoutes: ["/", "/((?!admin).*)"], // Everything except admin routes
})

export const config = {
  matcher: [
    "/admin/(.*)",  // Only match admin routes
    "/(api|trpc)(.*)" // And API routes if needed
  ],
}

