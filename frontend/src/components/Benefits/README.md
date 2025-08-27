# Benefits Component

Path: `frontend/src/components/Benefits/Benefits.jsx`

- Displays 4–6 benefit cards in a responsive grid (1 / 2 / 3 per row).
- Matches dark theme with red accents, hover lift, and accessible icon labels.

## Config
Defined in `frontend/src/components/Benefits/benefits.config.js`:
```js
export const defaultBenefits = [
  { id: 'instant-delivery', icon: 'Zap', title: 'Instant Delivery', description: 'Game keys and software licenses sent within seconds.' },
  // ...
];
```
- `icon` is the `lucide-react` icon name.

## Props
```ts
interface Benefit { id: string; icon: string; title: string; description: string }
interface BenefitsProps {
  title?: string;
  subtitle?: string;
  items?: Benefit[];   // defaults to defaultBenefits
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}
```

## Usage
```jsx
import Benefits from '@/components/Benefits/Benefits';
import { defaultBenefits } from '@/components/Benefits/benefits.config';

<Benefits
  title="Why Choose Us"
  subtitle="We deliver more than just games and software — we deliver value you can trust."
  items={defaultBenefits}
  ctaLabel="Shop Now"
  ctaHref="/products"
/>
``` 