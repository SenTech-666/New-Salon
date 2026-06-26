// app/account/favorites/page.tsx

import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { fetchMyFavorites } from '@/lib/client-db/actions';

export default async function FavoritesPage() {
  const favorites = await fetchMyFavorites();

  return (
    <div>
      <h1
        className="text-3xl sm:text-4xl font-bold italic mb-2"
        style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
      >
        Избранные салоны
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--landing-text-dim)' }}>
        Салоны, которые вы сохранили для быстрой записи
      </p>

      {favorites.length === 0 ? (
        <div
          className="flex flex-col items-center text-center py-16 rounded-3xl"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <Heart className="w-10 h-10 mb-3" style={{ color: 'var(--landing-accent)' }} />
          <p className="font-medium" style={{ color: 'var(--landing-text)' }}>Список избранного пуст</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--landing-text-faint)' }}>
            Нажмите на сердечко на странице салона, чтобы сохранить его сюда
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
              color: 'var(--landing-on-accent)',
            }}
          >
            Найти салон
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {favorites.map((salon) => (
            <Link
              key={salon.id}
              href={`/${salon.salon_slug}`}
              className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--landing-accent-10)' }}
              >
                {salon.salon_photo_url ? (
                  <img src={salon.salon_photo_url} alt={salon.salon_name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-accent)', fontStyle: 'italic', fontSize: 22 }}
                  >
                    {salon.salon_name[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
                >
                  {salon.salon_name}
                </p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--landing-text-faint)' }}>
                  <MapPin className="w-3 h-3" />
                  Перейти на страницу салона
                </p>
              </div>
              <Heart
                className="w-4 h-4 flex-shrink-0 transition-colors"
                style={{ color: 'var(--landing-accent)', fill: 'var(--landing-accent)' }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
