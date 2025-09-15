# GamePasals - Gaming Platform

A comprehensive gaming platform with user authentication, wallet system, and payment gateway integrations.

## 🚀 Features

### Authentication
- **Traditional Login/Signup**: Email and password based authentication
- **OAuth Integration**: 
  - Google OAuth 2.0 login
  - Facebook OAuth login
- **JWT Authentication**: Secure token-based authentication
- **User Management**: Profile management and wallet system

### Payment System
- **Wallet System**: Internal wallet for users with top-up functionality
- **Payment Gateways**:
  - **eSewa Integration**: Nepal's popular payment gateway
  - **Khalti Integration**: Digital wallet and payment gateway
- **Order Management**: Complete checkout and order processing
- **Real-time Updates**: Server-Sent Events (SSE) for wallet balance updates

### E-commerce Features
- **Product Catalog**: Gaming products and services
- **Shopping Cart**: Add/remove items, quantity management
- **Checkout Process**: Multiple payment methods
- **Order Tracking**: Order status and history

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Passport.js** for OAuth strategies
- **Axios** for external API calls
- **Crypto** for signature generation and verification

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API communication
- **Lucide React** for icons
- **CSS3** for styling

### Payment Gateways
- **eSewa**: Nepal's leading payment gateway
- **Khalti**: Digital wallet and payment platform

## 📁 Project Structure

```
GamePasals/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── checkoutController.js  # Checkout and order processing
│   │   ├── paymentController.js   # Payment gateway integration
│   │   ├── walletController.js    # Wallet management
│   │   ├── orderController.js     # Order management
│   │   └── webhookController.js   # Webhook handling
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Order.js              # Order schema
│   │   ├── WalletTransaction.js  # Wallet transaction schema
│   │   └── Product.js            # Product schema
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── paymentRoutes.js      # Payment routes
│   │   ├── walletRoutes.js       # Wallet routes
│   │   └── webhookRoutes.js      # Webhook routes
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   └── server.js                 # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PaymentMethodSelector/  # Reusable payment selector
│   │   ├── pages/
│   │   │   ├── Auth/             # Login/Signup pages
│   │   │   ├── Checkout/         # Checkout process
│   │   │   ├── Payment/          # Payment success/failure pages
│   │   │   └── Profile/          # User profile and wallet
│   │   ├── services/
│   │   │   ├── api.js            # Base API configuration
│   │   │   └── paymentAPI.js     # Payment API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication context
│   │   └── App.jsx               # Main app component
│   └── index.html                # HTML template with OAuth SDKs
└── README.md                     # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the backend directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/gamepasals

   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # OAuth - Google
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # OAuth - Facebook
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret

   # eSewa Configuration
   ESEWA_MERCHANT_ID=your_esewa_merchant_id
   ESEWA_SECRET_KEY=your_esewa_secret_key
   ESEWA_TOKEN=your_esewa_token

   # Khalti Configuration
   KHALTI_SECRET_KEY=your_khalti_secret_key
   KHALTI_PUBLIC_KEY=your_khalti_public_key
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## 🔐 OAuth Setup

### Google OAuth Setup

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`

2. **Update Environment Variables**:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Facebook OAuth Setup

1. **Facebook Developers**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Facebook Login product
   - Configure OAuth redirect URIs:
     - `http://localhost:5000/api/auth/facebook/callback`

2. **Update Environment Variables**:
   ```env
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

## 💳 Payment Gateway Setup

> **⚠️ Security Note**: Never commit actual credentials to version control. Use environment variables and keep sensitive information secure. Contact the respective payment gateway providers for test credentials.

### eSewa Integration

**Test Credentials** (Contact eSewa for test credentials):
- **eSewa ID**: Test user ID provided by eSewa
- **Password**: Test password provided by eSewa
- **MPIN**: Test MPIN provided by eSewa
- **Merchant ID**: Your eSewa merchant ID
- **Token**: Your eSewa API token
- **Secret Key**: Your eSewa secret key

**Features**:
- Payment initiation with form data submission
- Callback handling with base64 encoded data
- Signature verification (with fallback for test environment)
- Session expired error handling

### Khalti Integration

**Test Credentials** (Contact Khalti for test credentials):
- **Secret Key**: Your Khalti secret key
- **Public Key**: Your Khalti public key

**Features**:
- Payment initiation with redirect URL
- Callback handling with pidx verification
- Real-time payment status updates

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Payment
- `POST /api/payments/esewa/initiate` - Initiate eSewa payment
- `POST /api/payments/esewa/verify` - Verify eSewa payment
- `POST /api/payments/khalti/initiate` - Initiate Khalti payment
- `POST /api/payments/khalti/verify` - Verify Khalti payment

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/topup/gateway/init` - Initiate wallet top-up
- `GET /api/wallet/stream` - SSE for real-time balance updates

### Orders
- `POST /api/checkout/create-intent` - Create checkout intent
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get specific order

## 🎯 Key Features Implemented

### 1. OAuth Integration
- **Google OAuth**: Complete integration with Google Sign-In
- **Facebook OAuth**: Facebook Login with proper SDK initialization
- **JWT Tokens**: Secure authentication with refresh tokens
- **User Context**: React Context for authentication state management

### 2. Payment Gateway Integration
- **eSewa**: 
  - Form-based payment initiation
  - Base64 callback data handling
  - Fallback verification for test environment
  - Session expired error handling
- **Khalti**:
  - Redirect-based payment initiation
  - pidx-based verification
  - Real-time status updates

### 3. Wallet System
- **Top-up Functionality**: Gateway-based wallet top-ups
- **Real-time Updates**: SSE for instant balance updates
- **Transaction History**: Complete transaction tracking
- **Multiple Methods**: Support for different payment methods

### 4. Order Management
- **Checkout Process**: Complete cart to order flow
- **Payment Integration**: Seamless payment gateway integration
- **Order Tracking**: Order status and history
- **Atomic Transactions**: Database consistency with Mongoose sessions

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Errors**:
   - Ensure redirect URIs are correctly configured
   - Check client IDs and secrets in environment variables
   - Verify OAuth app settings in respective consoles

2. **Payment Gateway Errors**:
   - **eSewa 403 Error**: Handled with fallback verification
   - **Khalti Timeout**: Check network connectivity
   - **Signature Errors**: Verify secret keys and signature generation

3. **Frontend Issues**:
   - **Google Button Width**: Use numeric values instead of percentages
   - **Facebook SDK**: Ensure SDK is loaded before initialization
   - **SSE Connection**: Check backend server status

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📝 Recent Changes

### OAuth Integration (Initial Implementation)
- Added Google and Facebook OAuth support
- Implemented JWT-based authentication
- Created OAuth setup documentation
- Fixed React 19 compatibility issues

### Payment Gateway Integration
- Integrated eSewa and Khalti payment gateways
- Implemented wallet top-up functionality
- Added payment success/failure pages
- Created reusable payment method selector

### Bug Fixes and Improvements
- Fixed order number generation with timestamp-based approach
- Resolved signature verification issues
- Implemented fallback verification for eSewa test environment
- Added comprehensive error handling and logging
- Fixed frontend port configuration (5173 for Vite)

## 🔒 Security

### Important Security Practices

1. **Environment Variables**: Never commit actual credentials to version control
2. **API Keys**: Keep all API keys and secrets secure
3. **OAuth Credentials**: Use environment variables for OAuth client IDs and secrets
4. **Payment Gateway Credentials**: Store payment gateway credentials securely
5. **JWT Secrets**: Use strong, unique JWT secrets
6. **HTTPS**: Always use HTTPS in production
7. **Database Security**: Secure MongoDB connections and use authentication

### Credential Management

- Store all sensitive information in `.env` files
- Add `.env` to `.gitignore` to prevent accidental commits
- Use different credentials for development, staging, and production
- Regularly rotate API keys and secrets
- Monitor for any exposed credentials in logs or error messages

## 🚀 Deployment

### Production Considerations
- Update OAuth redirect URIs for production domains
- Use production payment gateway credentials
- Set up proper SSL certificates
- Configure production MongoDB instance
- Update environment variables for production

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
FRONTEND_URL=https://yourdomain.com
# ... other production credentials
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: September 2025
**Version**: 1.0.0
