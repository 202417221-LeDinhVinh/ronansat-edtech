import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function proxy(req) {
        const token = req.nextauth.token;

        // Check if user is accessing an admin route
        if (req.nextUrl.pathname.startsWith("/admin")) {
            // If they are not an admin, redirect them to the home page
            if (token?.role !== "admin") {
                return NextResponse.redirect(new URL("/", req.url));
            }
        }
    },
    {
        callbacks: {
            // By default, this callback determines if the proxy body should even execute.
            // Returning `!!token` ensures that the proxy forces authentication for the 
            // routes defined in the `matcher` array below. Unauthenticated users get redirected to `/auth`.
            authorized: ({ token }) => !!token,
        },
    }
);

// Apply proxy to these specific routes
export const config = {
    matcher: [
        "/admin/:path*",
        "/review/:path*",
        "/test/:path*"
    ],
};
