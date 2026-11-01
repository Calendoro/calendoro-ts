import type { BookingDto } from "../../contracts/src/index.js";
export declare const ATOMS_BOOKER_LABELS: {
    loading: string;
    date: string;
    noTimes: string;
    times: string;
    name: string;
    email: string;
    book: string;
    booked: string;
    failed: string;
};
export interface AtomsBookerProps {
    /** API base URL, e.g. https://api.example.com */
    apiUrl: string;
    username: string;
    slug: string;
    name?: string;
    email?: string;
    timeZone?: string;
    locale?: string;
    labels?: Partial<typeof ATOMS_BOOKER_LABELS>;
    /** The booking, without its secret manage link. Paid event types redirect to checkout instead. */
    onBooked?: (booking: Omit<BookingDto, "manageUrl">) => void;
    /** For tests. */
    fetch?: typeof fetch;
}
/** The whole local day in UTC instants wide enough for any zone: slots are then filtered to `date` in `timeZone`. */
export declare function atomsDayRange(date: string): {
    start: string;
    end: string;
};
export declare function atomsSlotsOnDate(slots: readonly string[], date: string, timeZone: string): string[];
export declare function atomsFilledAnswers(answers: Record<string, string>): Record<string, string>;
export declare function CalendoroBooker(p: AtomsBookerProps): import("react").JSX.Element;
