'use client';

// Единый провайдер темы для всего проекта (booking, admin, master, owner).
// Заменяет локальный useState, который раньше жил только внутри
// BookingPage — теперь .dark класс на <html> управляется отсюда и
// доступен любой странице через useTheme().
//
// Хранение: localStorage (ключ 'salon-theme'), значения 'dark' | 'light'.
// Дефолт — 'dark' (графит+медь), если ничего не сохранено.
//
// На будущее: когда появится привязка темы к аккаунту пользователя,
// здесь нужно будет читать стартовое значение из user.theme_preference
// (если есть) вместо/вместе с localStorage, и убрать видимый переключатель
// со страниц, оставив управление только в /admin/settings.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'salon-theme';

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Дефолт 'dark' держим и на сервере, и на клиенте до гидратации —
  // иначе будет несовпадение разметки (hydration mismatch). Реальное
  // сохранённое значение применяем в useEffect, уже на клиенте.
  const [theme, setThemeState] = useState<Theme>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    setThemeState(initial);
    applyThemeClass(initial);
    setHydrated(true);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyThemeClass(next);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // До гидратации не рендерим детей с потенциально неверной темой —
  // избегаем мигания неправильной палитры на первом кадре.
  // (suppressHydrationWarning на <html> в layout.tsx тоже нужен —
  // см. инструкцию ниже.)
  return (
    <ThemeContext.Provider value={{ theme: hydrated ? theme : 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme должен использоваться внутри <ThemeProvider>');
  }
  return ctx;
}