# Benefits Component

`Benefits` renders a configurable grid of trust and service highlights for marketing sections.

## File Paths

- `frontend/src/components/Benefits/Benefits.jsx`
- `frontend/src/components/Benefits/benefits.config.js`

## Default Behavior

- Renders a section title and optional subtitle
- Displays benefit cards in a responsive grid
- Resolves icons dynamically from `lucide-react`
- Optionally renders a CTA link below the grid

## Props

```ts
type Benefit = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type BenefitsProps = {
  title?: string;
  subtitle?: string;
  items?: Benefit[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};
```

## Default Content Source

The default benefit list is exported from `benefits.config.js`.

## Usage

```jsx
import Benefits from './Benefits';
import { defaultBenefits } from './benefits.config';

<Benefits
  title="Why Choose GamePasal"
  subtitle="Fast delivery, reliable products, and clear support."
  items={defaultBenefits}
  ctaLabel="Browse Products"
  ctaHref="/products"
/>
```

## Notes

- If an invalid icon name is provided, the component falls back to `Zap`.
- The component is presentation-oriented and has no API dependency.

