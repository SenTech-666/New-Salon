// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';


const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/master(.*)',
  '/owner(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isProtectedRoute(req)) {
    if (!userId) {
      const redirectUrl = new URL('/sign-in', req.url);
      redirectUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    // TODO: позже добавим проверку роли (OWNER/ADMIN) через Clerk metadata
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)', // Не трогаем статику
    '/',
    '/(api|trpc)(.*)',
  ],
};