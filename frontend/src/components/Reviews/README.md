# Reviews Component

`Reviews` renders a testimonial carousel with an API-backed review source and a static fallback list.

## File Path

- `frontend/src/components/Reviews/Reviews.jsx`

## Features

- Swiper-based responsive carousel
- optional API fetch from `/api/reviews`
- local fallback review list if the API is unavailable
- autoplay with reduced-motion awareness
- pause and resume behavior based on tab visibility
- Trustpilot-style call-to-action links

## Props

```ts
type Review = {
  id: string;
  quote: string;
  name: string;
  rating: number;
  avatarUrl?: string;
};

type ReviewsProps = {
  reviews?: Review[];
  trustpilotUrl?: string;
  fetchFromApi?: boolean;
  limit?: number;
  className?: string;
};
```

## Default Behavior

- `fetchFromApi` defaults to `true`
- `limit` defaults to `24`
- `trustpilotUrl` defaults to `https://www.trustpilot.com/`

## Usage

```jsx
import Reviews from './Reviews';

<Reviews
  trustpilotUrl="https://www.trustpilot.com/review/example.com"
  fetchFromApi={true}
  limit={24}
/>
```

Or pass a static list:

```jsx
<Reviews
  reviews={[
    { id: '1', quote: 'Fast delivery and smooth checkout.', name: 'Aarav', rating: 5 },
    { id: '2', quote: 'Reliable codes and clear support.', name: 'Sujan', rating: 5 }
  ]}
  fetchFromApi={false}
/>
```

## Behavior Notes

- On loading, the component shows skeleton cards.
- On API failure, it falls back to a small local review set.
- On very small screens, the carousel still renders two cards by default in the current implementation.
