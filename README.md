# Aptio — Современная SaaS-платформа для бьюти-салонов

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E)](https://supabase.com)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF)](https://clerk.com)

**Aptio** — это удобная и красивая платформа для онлайн-записи в салоны красоты, маникюрные студии и барбершопы.

### ✨ Основные возможности

- Красивая публичная страница салона по адресу `aptio.ru/{slug}`
- Умная система бронирования с выбором мастера, услуги и свободных слотов
- Личный кабинет владельца (админка) с управлением услугами, мастерами, складом и аналитикой
- Личный кабинет мастера с расписанием
- Мультитенантность с полной изоляцией данных
- Тарифные планы (Starter / Pro / Business)
- Поддержка white-label (свой домен) — в разработке
- Современный и приятный UI/UX

🛠 Технологии

Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
Авторизация: Clerk
База данных: Supabase (PostgreSQL) + Row Level Security
UI: Framer Motion, TanStack Query & Table, react-day-picker
Платежи: ЮKassa (рекуррентные платежи)
Email: Resend
Деплой: Vercel

📁 Структура проекта
textapp/
├── [slug]/                 # Публичная страница салона
├── admin/                  # Админка владельца
├── master/                 # Кабинет мастера
├── onboarding/             # Создание нового салона
├── api/                    # Server Actions
└── components/
🎯 Для владельцев салонов

Удобная онлайн-запись 24/7
Автоматическое управление расписанием
Контроль склада и расходников
Аналитика и отчёты
Минимальная комиссия

📋 План развития

 Публичная страница салона по slug
 Админ-панель и управление данными
 Полноценная система бронирования (конфликты, буфер времени)
 Рекуррентные платежи через ЮKassa
 White-label (кастомный домен)
 SMS и Telegram-уведомления
 Зарплатные расчёты мастеров
 Импорт данных из DIKIDI / YClients

📄 Лицензия
Коммерческий продукт © 2026 Aptio