// app/page.tsx
//
// Главная страница Aptio — клиентская витрина маркетплейса:
// поиск салона, каталог, как это работает, FAQ. Структура и
// визуал 1:1 с фигма-макетом (App.tsx). Раздел ConnectSalon
// заменён на компактный BusinessTeaser — полное содержание
// «Как подключить салон» переезжает на отдельную страницу
// /business (продажа подписки владельцам, отдельное задание).

import "@/app/landing-theme.css";

import { Header } from "@/app/components/landing/Header";
import { Hero } from "@/app/components/landing/Hero";
import { Services } from "@/app/components/landing/Services";
import { SalonList } from "@/app/components/landing/SalonList";
import { Comparison } from "@/app/components/landing/Comparison";
import { BusinessTeaser } from "@/app/components/landing/BusinessTeaser";
import { FAQ } from "@/app/components/landing/FAQ";
import { Footer } from "@/app/components/landing/Footer";

export const metadata = {
  title: "Aptio — найдите салон и запишитесь онлайн",
  description:
    "Aptio: поиск салонов красоты по услуге, району и бюджету. Сравните цены, посмотрите свободные окна и запишитесь без звонков.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF7F3]">
      <Header />
      <main>
        <Hero />
        <Services />
        <SalonList />
        <Comparison />
        <BusinessTeaser />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
