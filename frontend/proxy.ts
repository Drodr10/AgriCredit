import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { userId, sessionClaims } = await auth();
  
  if (userId) {
    const role = (sessionClaims?.metadata as Record<string, unknown>)?.role || (sessionClaims as Record<string, unknown>)?.role || null;
    const isRoleSelectionPage = req.nextUrl.pathname === '/role';
    
    console.log(`[MIDDLEWARE] Path: ${req.nextUrl.pathname}, Role in claims:`, role);
    console.log(`[MIDDLEWARE] Raw claims:`, JSON.stringify(sessionClaims));
    
    if (!role && !isRoleSelectionPage) {
      console.log(`[MIDDLEWARE] Redirecting to /role because no role found`);
      return NextResponse.redirect(new URL('/role', req.url));
    }
    
    if (role && isRoleSelectionPage) {
       console.log(`[MIDDLEWARE] Redirecting to dashboard because role is found:`, role);
       const destination = role === 'farmer' ? '/farmerplaceholder' : '/lenderplaceholder';
       return NextResponse.redirect(new URL(destination, req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
