// components/ui/animated-hero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, Star } from 'lucide-react';

export default function AnimatedHero() {
  return (
    <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-7xl md:text-[6.5rem] font-bold tracking-tighter mb-4">
          ВАСИЛИКИ
        </h1>
        <p className="text-3xl md:text-4xl mb-10 font-light">Маникюр, от которого не оторваться</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link href="/booking">
          <Button size="lg" className="text-xl px-12 py-7 bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-full font-medium">
            Записаться онлайн
          </Button>
        </Link>
        <Link href="#features">
          <Button size="lg" variant="outline" className="text-xl px-10 py-7 border-white text-white hover:bg-white hover:text-slate-900 rounded-full">
            Почему мы лучшие
          </Button>
        </Link>
      </div>

      <div className="mt-12 flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5" /> 4.98
        </div>
        <div>Более 1200 отзывов</div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" /> Запись за 30 сек
        </div>
      </div>
    </div>
  );
}