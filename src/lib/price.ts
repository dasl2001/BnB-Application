import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { parseISO } from "date-fns/parseISO";

/*
Beräknar totalpriset för en bokning baserat på:
pris per natt (price)
incheckningsdatum (inISO)
utcheckningsdatum (outISO)
Parametrar:
price: number → pris per natt
inISO: string → incheckningsdatum i ISO-format (YYYY-MM-DD)
outISO: string → utcheckningsdatum i ISO-format (YYYY-MM-DD)
Returvärde:
totalpris (number) avrundat till två decimaler
*/
export function calcTotalPrice(price: number, inISO: string, outISO: string) {

/*
Beräkna antal nätter mellan två datum
*/
  const nights = differenceInCalendarDays(parseISO(outISO), parseISO(inISO));

/*
Säkerställ att utcheckning sker efter incheckning
*/
  if (nights <= 0) throw new Error("check_out_date måste vara efter check_in_date");

/*
Multiplicera pris per natt med antal nätter och avrunda till två decimaler för att undvika flyttalsfel
*/
  return Number((price * nights).toFixed(2));
}

