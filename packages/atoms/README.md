# @calendoro/atoms

React components for Calendoro booking inside your own app. Needs React 18 or 19.

```sh
npm install @calendoro/atoms
```

```tsx
import { CalendoroBooker, CalendoroEmbed, CalendoroPopupButton } from "@calendoro/atoms";

// A native, unstyled form on the public API: every element takes your CSS.
<CalendoroBooker apiUrl="https://api.calendoro.app" username="ann" slug="intro" />

// The hosted page in a frame, inline or behind a button.
<CalendoroEmbed url="https://your-calendoro-site/ann/intro" />
<CalendoroPopupButton url="https://your-calendoro-site/ann/intro">Book a time</CalendoroPopupButton>
```

`@calendoro/atoms/compose` has helpers for putting booking links into messages from email and chat add-ins.

MIT licensed.
