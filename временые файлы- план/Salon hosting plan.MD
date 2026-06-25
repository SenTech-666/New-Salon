# План старта и хостинга — Salon Management System
> Дата: 25.06.2026 | Соло-разработчик | Бюджет: минимальный

---

## 1. Инфраструктура (что покупаем)

### VPS — Timeweb Cloud
| Параметр | Значение |
|---|---|
| Тариф | Фиксированная — Premium NVMe |
| CPU | 2 x 3.3 ГГц |
| RAM | 2 ГБ |
| NVMe | 40 ГБ |
| Регион | Санкт-Петербург (SPB-3) |
| ОС | Ubuntu 24.04 |
| IPv4 | Публичный IP (+180 ₽/мес) |
| IPv6 | Бесплатно (включить!) |
| Бэкапы | НЕ включать (делаем сами через pg_dump) |
| **Цена** | **~882 ₽/мес** |

**Ссылка:** https://timeweb.cloud/my/servers/create

### Домен
| Параметр | Значение |
|---|---|
| Зона | .ru (рекомендуется) |
| Цена | ~150–200 ₽/год (~15 ₽/мес) |
| Где купить | Timeweb или REG.RU |
| Когда покупать | Можно после запуска (на старте работаем по IP) |

### SSL-сертификат
Бесплатно через **Let's Encrypt** — устанавливается командой `certbot` после деплоя.

---

## 2. Полная стоимость в месяц

| Статья | Цена/мес |
|---|---|
| VPS Timeweb (2 CPU / 2 ГБ / 40 ГБ) | 882 ₽ |
| Домен .ru | ~15 ₽ |
| SSL (Let's Encrypt) | 0 ₽ |
| SMS.ru (авторизация по телефону) | 0–50 ₽ |
| **ИТОГО** | **~900–950 ₽/мес** |

---

## 3. Что живёт на одном сервере

На одном VPS размещается **всё**:
- PostgreSQL 16 + PostGIS (база данных)
- Next.js приложение (сам сайт)
- Nginx (веб-сервер / reverse proxy)
- SSL-сертификат

Дополнительный хостинг для сайта **не нужен**.

---

## 4. Стек технологий (замена Supabase)

| Компонент | Было (Supabase) | Станет |
|---|---|---|
| База данных | Supabase PostgreSQL | PostgreSQL 16 на VPS |
| PostGIS | Supabase PostGIS | PostgreSQL-16-postgis-3 |
| Аутентификация | Clerk | NextAuth.js v5 |
| SMS/телефон | — | SMS.ru (РФ) |
| Storage (файлы) | Supabase Storage | Локально на VPS |
| RLS политики | auth.jwt() в БД | Проверки в Next.js серверных экшенах |
| ORM | supabase-js | Drizzle ORM |
| Бэкапы | Автоматически | pg_dump по крону |

---

## 5. Настройка сервера (Cloud-init скрипт)

Вставить в поле **Cloud-init** при создании VPS на Timeweb:

```bash
#!/bin/bash
apt-get update && apt-get upgrade -y
apt-get install -y postgresql-16 postgresql-16-postgis-3 ufw fail2ban nginx

# Firewall — только SSH и HTTP/HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# PostgreSQL запускаем
systemctl enable postgresql
systemctl start postgresql

# Nginx запускаем
systemctl enable nginx
systemctl start nginx
```

> ⚠️ Порт 5432 (PostgreSQL) не открывать снаружи! Приложение подключается локально.

---

## 6. SSH-ключ (обязательно!)

Создать SSH-ключ в PowerShell на Windows:
```powershell
ssh-keygen -t ed25519 -C "salon-server"
# Нажать Enter 3 раза

# Скопировать публичный ключ:
cat $env:USERPROFILE\.ssh\id_ed25519.pub
```
Вставить вывод в поле **"Загрузить новый ключ"** на Timeweb.

---

## 7. Порядок действий после создания VPS

### Шаг 1 — Подключение к серверу
```bash
ssh root@ВАШ_IP_АДРЕС
```

### Шаг 2 — Настройка PostgreSQL
```bash
sudo -u postgres psql

-- Создать пользователя
CREATE USER aptio WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ_ЗДЕСЬ' SUPERUSER;

-- Создать базу
CREATE DATABASE aptio_db OWNER aptio;

-- Включить PostGIS
\c aptio_db
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### Шаг 3 — Создать схему БД
Выполнить DDL-скрипт (порядок таблиц):
`plans` → `salons` → `masters` → `services` / `master_weekly_hours` / `master_blocks` /
`master_invites` / `salon_members` / `salon_gallery_images` / `inventory_items` →
`bookings` / `service_consumables` → `inventory_movements` → `subscriptions`

### Шаг 4 — Экспорт данных из Supabase
Через SQL Editor в браузере Supabase:
```sql
COPY plans TO STDOUT WITH CSV HEADER;
COPY salons TO STDOUT WITH CSV HEADER;
-- и т.д. в том же порядке
```

### Шаг 5 — Деплой Next.js
```bash
# На сервере
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

npm install -g pm2

# Клонируем проект
git clone ВАШ_РЕПОЗИТОРИЙ /var/www/salon
cd /var/www/salon
npm install
npm run build

# Запускаем через PM2
pm2 start npm --name "salon" -- start
pm2 save
pm2 startup
```

### Шаг 6 — Nginx конфиг
```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Шаг 7 — SSL (бесплатно)
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d ВАШ_ДОМЕН.ru
```

---

## 8. Бэкапы (автоматически, бесплатно)

```bash
# Создать скрипт бэкапа
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U aptio aptio_db > /var/backups/salon_$DATE.sql
# Удалить бэкапы старше 7 дней
find /var/backups -name "salon_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Добавить в cron — каждый день в 3:00
crontab -e
# Добавить строку:
# 0 3 * * * /usr/local/bin/backup-db.sh
```

---

## 9. Основные проблемы миграции (что нужно переписать)

### auth.jwt() → параметры функций
Все 8 функций, использующих `auth.jwt() ->> 'sub'`, нужно переписать:
```sql
-- Было:
v_clerk_user_id := auth.jwt() ->> 'sub';

-- Станет:
-- добавить параметр p_user_id text в функцию
v_clerk_user_id := p_user_id;
```

Затронутые функции: `register_salon`, `accept_master_invite`, `accept_salon_invite`,
`current_salon_id`, `current_master_id`, `current_role_in_salon`, `current_salon_role`.

### RLS → серверные экшены Next.js
```typescript
// Вместо RLS политик в БД — проверка в коде:
const { userId } = auth(); // NextAuth
const member = await db.query.salon_members.findFirst({
  where: and(
    eq(salon_members.clerk_user_id, userId),
    eq(salon_members.salon_id, salonId)
  )
});
if (!member) throw new Error('Forbidden');
```

---

## 10. Ёмкость сервера (сколько выдержит)

| Метрика | Значение |
|---|---|
| Одновременных активных пользователей | 20–40 |
| Салонов (тестовых) | до 50–100 |
| Объём БД | ~2–5 ГБ (хватит на годы) |
| Когда апгрейдить | При 50+ активных салонах или тормозах |
| Следующий тариф | 2 CPU / 4 ГБ RAM (~1000 ₽/мес) |

---

## 11. Что нужно собрать из Supabase (TODO)

Выполнить в SQL Editor Supabase перед отключением:

```sql
-- 1. Индексы
SELECT indexname, tablename, indexdef
FROM pg_indexes WHERE schemaname = 'public';

-- 2. Триггеры
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers WHERE trigger_schema = 'public';

-- 3. RLS политики
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public';
```

---

*Документ создан 25.06.2026*