import { type ReactNode } from "react";
export interface AtomsEmbedProps {
    /** Full booking page URL, e.g. https://app.example.com/alice/intro-call */
    url: string;
    lang?: string;
    name?: string;
    email?: string;
    /** Booking page CSS variables, e.g. { "--accent": "#7c3aed" }. */
    cssVars?: Record<string, string>;
    title?: string;
    /** The booking, without its secret manage link. */
    onBooked?: (booking: unknown) => void;
}
export declare function atomsEmbedUrl(p: Pick<AtomsEmbedProps, "url" | "lang" | "name" | "email" | "cssVars">, pageSearch?: string): string | null;
export declare function CalendoroEmbed(props: AtomsEmbedProps): import("react").JSX.Element | null;
/** A button that opens the booking page in a native modal dialog. */
export declare function CalendoroPopupButton({ children, closeLabel, className, ...embed }: AtomsEmbedProps & {
    children: ReactNode;
    closeLabel?: string;
    className?: string;
}): import("react").JSX.Element;
