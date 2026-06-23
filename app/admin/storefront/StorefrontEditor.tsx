'use client';

import { useActionState, useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Camera, ImagePlus, Trash2, ExternalLink,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import {
  updateSalonInfo,
  updateSocialLinks,
  updateBusinessHours,
  deleteGalleryImage,
} from './Actions';

type DaySchedule = {
  day_of_week: number;
  is_day_off: boolean;
  time_from: string;
  time_to: string;
};

type Salon = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  photo_url: string | null;
  cover_url: string | null;
  business_hours: DaySchedule[] | null;
  social_links: Record<string, string> | null;
  lat: number | null;
  lng: number | null;
};

type GalleryImage = {
  id: string;
  url: string;
  position: number;
};

const DAY_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const SOCIAL_KEYS = ['telegram', 'instagram', 'vk', 'whatsapp'] as const;
const SOCIAL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  vk: 'ВКонтакте',
  whatsapp: 'WhatsApp',
};

function StatusBadge({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.error) return (
    <span className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" /> {state.error}
    </span>
  );
  if (state.success) return (
    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-4 w-4" /> Сохранено
    </span>
  );
  return null;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
      {children}
    </div>
  );
}

function InfoSection({ salon }: { salon: Salon }) {
  const [state, action, pending] = useActionState(updateSalonInfo, null);
  return (
    <SectionCard title="Основная информация">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Название салона</Label>
            <Input id="name" name="name" defaultValue={salon.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={salon.phone ?? ''} placeholder="+7 (999) 000-00-00" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Адрес</Label>
          <Input id="address" name="address" defaultValue={salon.address ?? ''} placeholder="Москва, ул. Пример, 1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" name="description" defaultValue={salon.description ?? ''} rows={3} placeholder="Расскажите о салоне — это текст на публичной странице" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lat">Широта (для карты)</Label>
            <Input id="lat" name="lat" type="number" step="any" defaultValue={salon.lat ?? ''} placeholder="55.7558" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lng">Долгота (для карты)</Label>
            <Input id="lng" name="lng" type="number" step="any" defaultValue={salon.lng ?? ''} placeholder="37.6173" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
          <StatusBadge state={state} />
        </div>
      </form>
    </SectionCard>
  );
}

function PhotoUploadButton({
  type, currentUrl, label, aspect,
}: {
  type: 'photo' | 'cover';
  currentUrl: string | null;
  label: string;
  aspect: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    startTransition(async () => {
      try {
        const res = await fetch('/api/salon/photo', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) setError(data.error ?? 'Не удалось загрузить фото');
      } catch {
        setError('Не удалось загрузить фото. Проверьте соединение.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={`group relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary/50 hover:bg-muted/70 ${aspect}`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
            <Camera className="h-8 w-8" />
            <span className="text-sm">Нажмите, чтобы загрузить</span>
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {previewUrl && !pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-7 w-7 text-white" />
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function PhotosSection({ salon }: { salon: Salon }) {
  return (
    <SectionCard title="Фото профиля и обложка">
      <div className="grid gap-6 sm:grid-cols-2">
        <PhotoUploadButton type="photo" currentUrl={salon.photo_url} label="Фото профиля (логотип)" aspect="aspect-square max-w-[180px]" />
        <PhotoUploadButton type="cover" currentUrl={salon.cover_url} label="Обложка (шапка страницы)" aspect="aspect-[16/7]" />
      </div>
    </SectionCard>
  );
}

function GallerySection({ initialImages }: { initialImages: GalleryImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);

    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/salon/gallery', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error ?? 'Не удалось загрузить фото');
          break;
        }
        // Добавляем фото в список без перезагрузки страницы
        if (data.id && data.url) {
          setImages((prev) => [...prev, { id: data.id, url: data.url, position: prev.length + 1 }]);
        }
      } catch {
        setError('Не удалось загрузить фото. Проверьте соединение.');
        break;
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await deleteGalleryImage(id);
    if (res.error) {
      setError(res.error);
      setDeletingId(null);
    } else {
      setImages((prev) => prev.filter((img) => img.id !== id));
      setDeletingId(null);
    }
  }

  return (
    <SectionCard title="Галерея работ">
      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Фотографий пока нет. Добавьте первые работы — они появятся на публичной странице салона.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => handleDelete(img.id)}
              disabled={deletingId === img.id}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 opacity-0 shadow transition group-hover:opacity-100 hover:bg-destructive hover:text-white disabled:opacity-50"
              aria-label="Удалить фото"
            >
              {deletingId === img.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/70 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs">{uploading ? 'Загрузка...' : 'Добавить'}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </SectionCard>
  );
}

function HoursSection({ salon }: { salon: Salon }) {
  const [state, action, pending] = useActionState(updateBusinessHours, null);
  const defaultHours = Array.from({ length: 7 }, (_, i) => {
    const existing = salon.business_hours?.find((h) => h.day_of_week === i);
    return existing ?? { day_of_week: i, is_day_off: i === 0, time_from: '09:00', time_to: '20:00' };
  });
  const [hours, setHours] = useState(defaultHours);

  function toggle(i: number) {
    setHours((prev) => prev.map((h) => h.day_of_week === i ? { ...h, is_day_off: !h.is_day_off } : h));
  }
  function setTime(i: number, field: 'time_from' | 'time_to', val: string) {
    setHours((prev) => prev.map((h) => h.day_of_week === i ? { ...h, [field]: val } : h));
  }

  return (
    <SectionCard title="Часы работы">
      <form action={action} className="flex flex-col gap-4">
        {hours.map((h) => (
          <div key={h.day_of_week} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name={`day_${h.day_of_week}_off`} value={String(h.is_day_off)} />
            <input type="hidden" name={`day_${h.day_of_week}_from`} value={h.time_from} />
            <input type="hidden" name={`day_${h.day_of_week}_to`} value={h.time_to} />
            <Switch checked={!h.is_day_off} onCheckedChange={() => toggle(h.day_of_week)} id={`day-${h.day_of_week}`} />
            <Label htmlFor={`day-${h.day_of_week}`} className="w-28 cursor-pointer">{DAY_FULL[h.day_of_week]}</Label>
            {h.is_day_off ? (
              <span className="text-sm text-muted-foreground">Выходной</span>
            ) : (
              <div className="flex items-center gap-2">
                <Input type="time" value={h.time_from} onChange={(e) => setTime(h.day_of_week, 'time_from', e.target.value)} className="w-28" />
                <span className="text-muted-foreground">—</span>
                <Input type="time" value={h.time_to} onChange={(e) => setTime(h.day_of_week, 'time_to', e.target.value)} className="w-28" />
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить расписание
          </Button>
          <StatusBadge state={state} />
        </div>
      </form>
    </SectionCard>
  );
}

function SocialSection({ salon }: { salon: Salon }) {
  const [state, action, pending] = useActionState(updateSocialLinks, null);
  const links = salon.social_links ?? {};
  return (
    <SectionCard title="Социальные сети и мессенджеры">
      <form action={action} className="flex flex-col gap-4">
        {SOCIAL_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={key}>{SOCIAL_LABELS[key]}</Label>
            <Input
              id={key} name={key} defaultValue={links[key] ?? ''}
              placeholder={
                key === 'telegram' ? 'https://t.me/yoursalon'
                : key === 'instagram' ? 'https://instagram.com/yoursalon'
                : key === 'vk' ? 'https://vk.com/yoursalon'
                : 'https://wa.me/79991234567'
              }
            />
          </div>
        ))}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
          <StatusBadge state={state} />
        </div>
      </form>
    </SectionCard>
  );
}

export default function StorefrontEditor({ salon, gallery }: { salon: Salon; gallery: GalleryImage[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Витрина салона</h1>
          <p className="mt-1 text-sm text-muted-foreground">Здесь вы управляете публичной страницей, которую видят клиенты</p>
        </div>
        <a href={`/${salon.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          Открыть страницу
        </a>
      </div>
      <InfoSection salon={salon} />
      <PhotosSection salon={salon} />
      <GallerySection initialImages={gallery} />
      <HoursSection salon={salon} />
      <SocialSection salon={salon} />
    </div>
  );
}