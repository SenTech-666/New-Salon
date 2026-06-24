// app/page.tsx

import "@/app/landing-theme.css";
import { Suspense } from "react";

import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { SalonList } from "@/components/landing/SalonList";
import { Comparison } from "@/components/landing/Comparison";
import { BusinessTeaser } from "@/components/landing/BusinessTeaser";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Aptio — найдите салон и запишитесь онлайн",
  description:
    "Aptio: поиск салонов красоты по услуге, району и бюджету. Сравните цены, посмотрите свободные окна и запишитесь без звонков.",
};

type Props = {
  searchParams: Promise<{
    name?: string
    service?: string
    price?: string
    city?: string
  }>
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-[#FAF7F3]">
      <Header />
      <main>
        <Hero />
        <Services />
        <Suspense fallback={<SalonListSkeleton />}>
          <SalonList searchParams={params} />
        </Suspense>
        <Comparison />
        <BusinessTeaser />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

function SalonListSkeleton() {
  return (
    <section className="bg-[#FAF7F3] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#C4A882]/12 overflow-hidden animate-pulse">
              <div className="h-48 bg-[#F3EDE3]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#F3EDE3] rounded w-3/4" />
                <div className="h-3 bg-[#F3EDE3] rounded w-1/2" />
                <div className="h-3 bg-[#F3EDE3] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}