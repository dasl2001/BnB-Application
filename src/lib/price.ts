import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { parseISO } from "date-fns/parseISO";
export function calcTotalPrice(price: number, inISO: string, outISO: string) {
  const nights = differenceInCalendarDays(parseISO(outISO), parseISO(inISO));
  if (nights <= 0) throw new Error("check_out_date måste vara efter check_in_date");
  return Number((price * nights).toFixed(2));
}

