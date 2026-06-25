Статусы дня в календаре переноса
СтатусУсловиеВидsame_master_availableу исходного мастера есть ≥1 свободный слот под услугу в этот денькак обычный "Свободно"other_master_onlyу исходного мастера нет окон, но есть ≥1 другой мастер с этой услугой свободендругой цвет/подпись "Только другой мастер"unavailableни одного мастера с этой услугой нет свободного в этот деньне кликабелен (как past/beyond)past / beyondкак сейчасбез изменений
Поток клика по дню в режиме переноса

same_master_available → открывается модалка на шаге time, мастер = исходный, показываем его слоты.
other_master_only → модалка открывается с явным экраном "У [Мария] нет окон в этот день. Доступны другие мастера для услуги [...]" → список альтернативных мастеров (как карточки, аналогичные шагу masters) → после выбора — шаг time для выбранного мастера.
unavailable → клик не работает (день некликабельный визуально и физически, disabled).

Смену мастера явно показываем как отдельный шаг с подтверждением — клиент видит, что это другой человек, прежде чем выбрать время, а не молча подставляем.
Фронт: что меняется/добавляется
Новый стейт для режима переноса:

rescheduleMode: boolean, originalBooking: { id, masterId, serviceId, date, time }
dayAvailabilityMap: Map<day, 'same_master' | 'other_master' | 'unavailable'> — заполняется одним батч-запросом при открытии календаря переноса и при смене месяца (аналог текущего getDaysInMonth/getDayStatus, но с данными из RPC, не локальными).
rescheduleStep: 'master_pick' | 'time' | 'confirm' — добавляется промежуточный шаг выбора мастера, но только когда исходный недоступен (не на каждом переносе — это сохраняет "не усложнять", если у исходного мастера всё ок, шаг просто скипается).

Изменения в существующих функциях:

getDayStatus — в режиме переноса берёт статус из dayAvailabilityMap, а не из confirmedBookings/местных дат.
handleDayClick — в режиме переноса ветвится: same → сразу time, other → master_pick, unavailable → no-op (уже заблокировано disabled).
handleConfirmBooking — в режиме переноса вызывает не insert, а reschedule_booking RPC с original_booking_id.
Кнопка "Перенести" в карточке записи — проверяет reschedule_min_hours локально (по времени исходной записи) и либо открывает режим переноса, либо показывает disabled-тултип.

Это можно реализовать прямо сейчас как мок: dayAvailabilityMap временно генерируется случайно/из заглушки, а сама структура компонента, статусы и переходы — рабочие, чтобы при подключении бэкенда поменять только источник данных.
Бэкенд: SQL-спека (для тебя на потом)
1. get_reschedule_day_availability
sqlget_reschedule_day_availability(
  p_salon_slug text,
  p_service_id uuid,
  p_original_master_id uuid,
  p_date_from date,
  p_date_to date
) returns table (
  date date,
  same_master_available boolean,
  other_master_available boolean
)
Считает за один проход по диапазону дат (месяц) и по всем мастерам салона, у кого активна эта услуга:

для каждого дня и каждого подходящего мастера — day_of_week → проверка weekly_hours (не выходной, окно ≥ duration услуги) минус blocks (full-day/частичные) минус занятые интервалы bookings (с учётом duration каждой записи, не только старта) → получаем булево "есть ли непрерывный слот ≥ duration".
агрегируем: same_master_available = bool_or(...) where master_id = p_original_master_id, other_master_available = bool_or(...) where master_id != p_original_master_id.

Это набор-ориентированный запрос (CTE: service_duration → candidate_masters (по услуге) → day_master_grid (cross join дни×мастера) → working_windows (из weekly_hours) → subtract blocks → subtract bookings → has_gap >= duration) — один SQL-вызов на весь месяц, без N+1.
2. get_master_slots_for_date (уже описан раньше, переиспользуется)
Для конкретного мастера+дату+услугу — список доступных таймслотов. Используется и в обычной записи, и в шаге time при переносе.
3. reschedule_booking
sqlreschedule_booking(
  p_booking_id uuid,
  p_new_date date,
  p_new_time time,
  p_new_master_id uuid -- может совпадать со старым
) returns booking_row
SECURITY DEFINER, внутри одной транзакции:

Проверить, что now() < original.date+time - salon.reschedule_min_hours (запрет переноса слишком близко к старому времени — серверная проверка, не только фронтовая).
Повторно проверить, что новый слот свободен (та же логика занятости, что в п.1/п.2) — защита от гонки между двумя клиентами.
update bookings set date=.., time=.., master_id=.., status='rescheduled_pending' (или оставить pending).
Вернуть обновлённую запись.

4. Новое поле в salons
reschedule_min_hours integer default 24 — настройка из админки, как ты и описал.