// app/sign-up/[[...sign-up]]/page.tsx
//
// Clerk требует catch-all роут [[...sign-up]] для своего компонента
// <SignUp /> — он сам рисует под-шаги (email -> код подтверждения ->
// пароль) на под-путях вида /sign-up/verify-email-address, и без
// catch-all эти под-пути будут давать 404.
//
// fallbackRedirectUrl — куда уходим, если у Clerk нет специального
// redirect_url из query (?redirect_url=...). Указываем /onboarding,
// а не /admin напрямую: у нового пользователя salon_members ещё нет
// записи, поэтому /admin его не пустит (а если бы пустил — он увидел
// бы пустой кабинет без салона, что хуже, чем явный шаг создания
// профиля салона).
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignUp
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
        appearance={{
          variables: {
            colorPrimary: '#C76E3D',
          },
        }}
      />
    </div>
  );
}