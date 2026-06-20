// lib/scheduling.ts
// Общие хелперы для работы с графиком мастеров: генерация сетки времени
// и определение дня недели в формате, совпадающем с master_weekly_hours
// (0 = воскресенье ... 6 = субота, как JS Date.getDay()).

export const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAY_NAMES_FULL = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export type DaySchedule = {
  day_of_week: number;
  is_day_off: boolean;
  time_from: string | null; // 'HH:MM' или 'HH:MM:SS'
  time_to: string | null;
};

/**
 * Возвращает день недели (0-6, 0=Вс) для строки даты вида 'YYYY-MM-DD'.
 * Парсим вручную (а не через new Date(dateStr)), чтобы избежать сдвига
 * из-за часового пояса браузера/сервера.
 */
export function dayOfWeekFromDateString(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

/** Обрезает 'HH:MM:SS' до 'HH:MM' */
function toHHMM(time: string): string {
  return time.slice(0, 5);
}

/** Добавляет минуты к строке 'HH:MM', возвращает 'HH:MM' */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Сравнение 'HH:MM' строк */
function isBeforeOrEqual(a: string, b: string): boolean {
  return a <= b;
}

/**
 * Генерирует список слотов 'HH:MM' от time_from до time_to с шагом stepMinutes,
 * включая только те слоты, на которые услуга длительностью serviceDuration
 * успевает закончиться до time_to (чтобы не предлагать запись, которая
 * вылезает за закрытие).
 */
export function generateTimeSlots(
  timeFrom: string,
  timeTo: string,
  stepMinutes: number,
  serviceDuration: number
): string[] {
  const from = toHHMM(timeFrom);
  const to = toHHMM(timeTo);
  const slots: string[] = [];

  let current = from;
  // защита от бесконечного цикла при некорректных данных
  let guard = 0;
  while (isBeforeOrEqual(addMinutes(current, serviceDuration), to) && guard < 200) {
    slots.push(current);
    current = addMinutes(current, stepMinutes);
    guard++;
  }

  return slots;
}

/** Дефолтный шаблон графика для нового мастера / общих настроек */
export function defaultWeeklyTemplate(): DaySchedule[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day_of_week: day,
    is_day_off: day === 0,
    time_from: day === 0 ? null : '10:00',
    time_to: day === 0 ? null : '20:00',
  }));
}