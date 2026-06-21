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
    // Точную роль middleware не знает (это требует похода в БД, что
    // в middleware дороже) — middleware просто отсекает неавторизованных.
    // Финальная проверка роли — на уровне RLS и в самих страницах/layout'ах.
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