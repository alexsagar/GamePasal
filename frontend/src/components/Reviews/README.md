# Reviews Component

Path: `frontend/src/components/Reviews/Reviews.jsx`

## Props
```ts
type Review = {
  id: string;
  quote: string;
  name: string;
  rating: number; // 1–5
  avatarUrl?: string;
};

interface ReviewsProps {
  reviews?: Review[];          // optional static list
  trustpilotUrl?: string;      // external URL for the pill + label
  fetchFromApi?: boolean;      // default true; when true, GET /api/reviews?limit=<limit>
  limit?: number;              // default 24 when fetching
  className?: string;          // optional extra class on the section
}
```

## Usage
```jsx
import Reviews from '@/components/Reviews/Reviews';

// Static list
const list = [
  { id: '1', quote: 'Quick and reliable subscription service!', name: 'Sujan', rating: 5 },
  { id: '2', quote: 'Great prices and instant delivery.', name: 'Aarav', rating: 5 },
];

<Reviews reviews={list} trustpilotUrl="https://www.trustpilot.com/review/yourdomain.com" fetchFromApi={false} />

// Or fetch from API with fallback
<Reviews trustpilotUrl="https://www.trustpilot.com/review/yourdomain.com" fetchFromApi={true} limit={30} />
```

- Autoplay: 3.5s, loops, pauses on hover and when tab hidden; disabled if user prefers reduced motion.
- Responsive slides per view: 1 (<640px), 2 (≥640px), 3 (≥1024px), 4 (≥1440px).
- Accessible: ARIA labels on container, slides, and pagination buttons.
- Loading: shows 3 skeleton cards; on error, falls back to a small static list.

## Trustpilot URL
- Set via `trustpilotUrl` prop wherever you render the component (e.g., `Home.jsx`).
- Example: `https://www.trustpilot.com/review/yourdomain.com`. 