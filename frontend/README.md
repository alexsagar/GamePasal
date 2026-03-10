# Frontend Application

This directory contains the React frontend for GamePasal.

## Stack

- React
- Vite
- React Router
- Axios
- Swiper
- Lucide React

## Main Responsibilities

- product browsing and search
- cart and checkout UI
- eSewa payment handoff and callback pages
- user authentication screens
- profile and order history views
- admin panel UI
- content presentation such as banners, reviews, and benefits

## Common Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Environment Variables

Typical `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Important Routes

- `/`
- `/products`
- `/software`
- `/product/:id`
- `/cart`
- `/checkout/review`
- `/checkout/payment`
- `/payment/esewa/success`
- `/payment/esewa/failure`
- `/profile`
- `/admin/*`

## Implementation Notes

- The app uses context providers for authentication and cart state.
- Checkout UI should always display the same total that the backend will charge.
- Recommendation UI is content-based and reused across product detail and post-add-to-cart flows.
- Admin pages depend on the authenticated backend API and are not standalone.

