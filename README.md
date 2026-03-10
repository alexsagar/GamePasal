# GamePasal

GamePasal is a digital commerce platform for game gift cards, redeem codes, software licenses, and account-based digital products. The current system uses a React frontend, an Express and MongoDB backend, and an eSewa-only checkout flow.

## Current Scope

- Product catalog for games, gift cards, and software
- Search, filtering, recommendations, and product detail pages
- Cart and checkout flow for authenticated users
- eSewa payment initiation and callback verification
- Order tracking, delivery workflow, and admin fulfillment tools
- Admin management for products, gift cards, orders, banners, and users
- Email, OAuth, 2FA, and content management support

## Active Payment Model

The live project is configured around a single checkout method:

- `eSewa` for customer checkout

The wallet and QR payment flows documented in older files are not part of the current live checkout path.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Swiper
- Lucide React

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer
- Passport-based social login handlers
- Cloudinary for image uploads

## Repository Structure

```text
GamePasals/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── vite.config.js
├── README.md
├── MIGRATION.md
├── OAUTH_SETUP.md
├── FONEPAY_QR_CHECKOUT.md
└── QR_PAYMENT_SETUP.md
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- MongoDB
- npm

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default:

- frontend runs on `http://localhost:5173`
- backend runs on `http://localhost:5000`

## Core Environment Variables

Create `backend/.env` with the values required for your environment.

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
APP_BASE_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/gamepasals

JWT_SECRET=replace_this
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_password
SMTP_FROM="GamePasal <no-reply@gamepasal.com>"

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=replace_this
ESEWA_GATEWAY_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `frontend/.env` if needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Main Application Flows

### Customer Flow

1. Browse products
2. Add items to cart
3. Review order
4. Start eSewa payment
5. Return to callback page for verification
6. Track order status in profile
7. Receive delivery after admin fulfillment or automated transition

### Admin Flow

1. Manage products and gift cards
2. Review and update orders
3. Deliver digital items
4. Manage banners and content
5. Review users and catalog data

## Important Routes

### Frontend

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

### Backend API

- `/api/auth/*`
- `/api/products/*`
- `/api/orders/*`
- `/api/checkout/*`
- `/api/payments/*`
- `/api/users/*`
- `/api/content/*`
- `/api/banners/*`

## Recommended Verification Commands

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
node --check backend/server.js
node --check backend/controllers/paymentController.js
node --check backend/controllers/orderController.js
```

## Notes

- The codebase still contains some historical structures from earlier payment experiments. The live checkout path is eSewa-only.
- Some documentation files are retained for historical reference and are marked accordingly.
- Production deployment should use secure credentials, HTTPS, and a properly configured MongoDB deployment.

