// components/shared/SignOutLink.tsx
'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export default function SignOutLink() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/' })}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-all text-sm w-full text-left"
    >
      <LogOut className="w-4 h-4" />
      Выйти
    </button>
  );
}