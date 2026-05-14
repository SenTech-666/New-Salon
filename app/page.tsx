// app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Award, Shield, Sparkles, Clock, Star } from 'lucide-react';
import AnimatedHero from '@/components/ui/animated-hero';

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Василики",
    "description": "Студия премиум маникюра в Москве. Онлайн-запись, 100% стерильность, опыт более 5 лет.",
    "url": "https://yourdomain.ru",
    "telephone": "+7 (999) 123-45-67",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Ленина, 25",
      "addressLocality": "Москва",
      "addressRegion": "Москва",
      "postalCode": "123456",
      "addressCountry": "RU"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "10:00",
        "closes": "21:00"
      }
    ],
    "priceRange": "$$"
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-slate-900">
      {/* JSON-LD для SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="hero-bg h-screen flex items-center justify-center relative text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <AnimatedHero />
      </section>

      {/* Преимущества */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-semibold text-center mb-16">Почему девушки возвращаются к нам</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Shield, 
                title: "100% стерильность", 
                desc: "Индивидуальные крафт-пакеты + стерилизатор класса B" 
              },
              { 
                icon: Award, 
                title: "Опыт 5+ лет", 
                desc: "Более 3500 довольных клиенток" 
              },
              { 
                icon: Sparkles, 
                title: "Только премиум", 
                desc: "Luxio, Kodi, Luna, Apres — ничего дешевле" 
              }
            ].map((item, i) => (
              <Card 
                key={i} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group"
              >
                <CardContent className="pt-10 pb-10 text-center">
                  <item.icon className="w-16 h-16 mx-auto mb-6 text-[#c9a08a] group-hover:text-[#b38f79] transition-colors" />
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + карта */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-4">Ждём тебя в студии</h2>
          <p className="text-xl text-slate-600 mb-10">Москва, ул. Ленина, 25 • 7 минут от метро</p>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl h-[480px] relative mb-12">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f5f0eb] to-[#e8d9cc]">
              <div className="text-center">
                <MapPin className="w-20 h-20 mx-auto mb-6 text-[#c9a08a]" />
                <p className="text-2xl font-medium">ул. Ленина, 25</p>
              </div>
            </div>
          </div>

          <Link href="/booking">
            <Button size="lg" className="text-2xl px-16 py-8 bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-full">
              Забронировать время прямо сейчас
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800">
        <p className="mb-3">© 2026 Василики • Премиум маникюр Москва</p>
        <Link href="/master/login" className="text-sm hover:text-white transition-colors">
          Кабинет мастера →
        </Link>
      </footer>
    </main>
  );
}