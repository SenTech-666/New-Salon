// app/sign-in/page.tsx
import { SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Scissors className="h-10 w-10 text-[#c9a08a]" />
            <span className="text-3xl font-semibold tracking-tight text-slate-900">Василики</span>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Вход в админку
            </CardTitle>
            <p className="text-slate-600 mt-2 text-lg">
              Для владельца и администраторов
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formButtonPrimary: 
                    "bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-2xl h-12 text-base font-medium transition-all active:scale-[0.985]",
                  formFieldInput: 
                    "rounded-2xl border-slate-200 focus:border-[#c9a08a] h-12 text-base",
                  socialButtonsBlockButton: 
                    "border-slate-200 hover:bg-slate-50 rounded-2xl h-12",
                  dividerLine: "bg-slate-200",
                  formFieldLabel: "text-slate-600",
                },
                options: {
                  socialButtonsVariant: "iconButton",
                },
              }}
            />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-8">
          Проблемы со входом? Напиши владельцу
        </p>
      </div>
    </div>
  );
}