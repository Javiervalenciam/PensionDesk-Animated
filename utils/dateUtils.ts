import { DeadlineUnit, Holiday } from "../types";

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addBusinessDays = (startDate: Date, days: number, holidays: Holiday[]): Date => {
  let count = 0;
  const result = new Date(startDate);
  const holidaySet = new Set(holidays.map(h => h.date));

  while (count < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const dateStr = formatDate(result);

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      count++;
    }
  }
  return result;
};

export const calculateDeadline = (
  startDateStr: string,
  unit: DeadlineUnit,
  quantity: number,
  holidays: Holiday[] = []
): string => {
  const startDate = parseDate(startDateStr);
  let endDate: Date;

  switch (unit) {
    case DeadlineUnit.DIAS_CALENDARIO:
      endDate = addCalendarDays(startDate, quantity);
      break;
    case DeadlineUnit.MESES:
      endDate = addMonths(startDate, quantity);
      break;
    case DeadlineUnit.DIAS_HABILES:
      endDate = addBusinessDays(startDate, quantity, holidays);
      break;
    default:
      endDate = startDate;
  }

  return formatDate(endDate);
};

export const getDaysDiff = (targetDateStr: string): number => {
  const target = parseDate(targetDateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};
