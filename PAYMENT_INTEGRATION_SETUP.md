# Payment Gateway Integration Setup

## Overview

This document outlines the complete integration of eSewa and Khalti payment gateways into the GamePasal platform. The integration supports both wallet top-ups and direct checkout payments.

## Features Implemented

### ✅ Backend Integration
- **eSewa Payment Gateway**: Complete integration with test credentials
- **Khalti Payment Gateway**: Complete integration with test credentials
- **Payment Controller**: Handles payment initiation and verification
- **Webhook Handlers**: Secure webhook processing for payment notifications
- **Wallet Integration**: Direct payment gateway top-ups
- **Transaction Management**: Complete audit trail and status tracking

### ✅ Frontend Integration
- **Payment Method Selector**: Modern UI component for payment method selection
- **Profile Wallet Section**: Enhanced with payment gateway options
- **Payment Success/Failure Pages**: User-friendly payment result pages
- **Real-time Updates**: SSE integration for wallet balance updates

## Payment Gateway Credentials

### eSewa Test Credentials
```
Client ID: JB0BBQ4aD0UqIThFJwAKBgAXEUkEGQUBBAwdOgABHD4DChwUAB0R
Client Secret: BhwIWQQADhIYSxILExMcAgFXFhcOBwAKBgAXEQ==
Merchant ID: EPAYTEST
Token: 123456
Secret Key: 8gBm/:&EnhH.1/q
```

### Khalti Test Credentials
```
Public Key: 7dfa19eb894343b6987c6932765a9772
Secret Key: 257c42b6b6bc40b4bbad0427fb0256d3
```

### Test User Credentials
```
eSewa ID: 9806800001/2/3/4/5
Password: Nepal@123
MPIN: 1122
```

## API Endpoints

### Payment Initiation
```
POST /api/payments/esewa/initiate
POST /api/payments/khalti/initiate
POST /api/wallet/topup/gateway/init
```

### Payment Verification
```
POST /api/payments/esewa/verify
POST /api/payments/khalti/verify
```

### Payment Status
```
GET /api/payments/status/:txnId
```

### Webhooks
```
POST /api/webhooks/esewa
POST /api/webhooks/khalti
POST /api/webhooks/esewa/wallet-topup
POST /api/webhooks/khalti/wallet-topup
```

## Frontend Routes

### Payment Pages
```
/payment/success - Payment success page
/payment/failure - Payment failure page
```

### Profile Wallet
```
/profile/wallet - Enhanced wallet section with payment options
```

## Usage Flow

### 1. Wallet Top-up Flow
1. User goes to Profile → Wallet
2. Enters amount (NPR 100 - 100,000)
3. Selects payment method (eSewa, Khalti, or eSewa QR)
4. For gateway payments: Redirects to payment gateway
5. For QR payments: Shows QR code for manual payment
6. Payment verification via webhook or manual verification
7. Wallet balance updated in real-time

### 2. Checkout Flow
1. User proceeds to checkout
2. Selects payment method
3. For gateway payments: Redirects to payment gateway
4. Payment verification and order completion
5. Real-time order status updates

## Security Features

### Webhook Verification
- HMAC signature verification for all webhooks
- Gateway-specific signature validation
- Development mode bypass for testing

### Transaction Security
- Idempotency keys to prevent duplicate transactions
- Atomic database transactions
- Comprehensive audit trail
- Real-time balance updates via SSE

## Configuration

### Environment Variables
```bash
# Frontend
VITE_API_URL=http://localhost:5000

# Backend
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Database Schema Updates
The integration uses existing `WalletTransaction` and `Order` models with additional fields:
- `gateway`: Payment gateway used
- `gatewayTransactionId`: Gateway-specific transaction ID
- `gatewayResponse`: Gateway response data
- `paymentUrl`: Payment gateway URL

## Testing

### Test Payment Flow
1. Use test credentials provided above
2. Initiate payment with test amounts
3. Complete payment using test user credentials
4. Verify wallet balance updates
5. Check transaction history

### Webhook Testing
Use tools like ngrok to expose local webhook endpoints:
```bash
ngrok http 5000
# Use the ngrok URL for webhook configuration
```

## Production Setup

### 1. Update Credentials
Replace test credentials with production credentials:
- Update `ESEWA_CONFIG` in `paymentController.js`
- Update `KHALTI_CONFIG` in `paymentController.js`
- Update webhook verification in `webhookController.js`

### 2. Configure Webhooks
Set up webhook URLs in payment gateway dashboards:
- eSewa: `https://yourdomain.com/api/webhooks/esewa/wallet-topup`
- Khalti: `https://yourdomain.com/api/webhooks/khalti/wallet-topup`

### 3. SSL Certificate
Ensure HTTPS is enabled for production webhook endpoints.

### 4. Environment Variables
```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Error Handling

### Payment Failures
- Automatic transaction status updates
- User-friendly error messages
- Retry mechanisms for failed payments
- Comprehensive logging

### Webhook Failures
- Signature verification failures
- Duplicate webhook handling
- Transaction not found scenarios
- Database transaction rollbacks

## Monitoring

### Transaction Monitoring
- Real-time transaction status tracking
- Payment success/failure rates
- Gateway response times
- Webhook delivery status

### Wallet Monitoring
- Balance update notifications
- Transaction history
- Admin approval workflows
- Audit trail maintenance

## Support

### Common Issues
1. **Payment not reflecting**: Check webhook delivery and verification
2. **Signature verification failed**: Verify webhook secret keys
3. **Transaction not found**: Check transaction ID mapping
4. **Balance not updating**: Verify SSE connection and wallet events

### Debugging
- Enable detailed logging in development
- Check webhook payloads
- Verify database transaction states
- Monitor SSE connections

## Future Enhancements

### Planned Features
- [ ] Additional payment gateways (ConnectIPS, IME Pay)
- [ ] Recurring payment support
- [ ] Payment analytics dashboard
- [ ] Mobile app integration
- [ ] International payment support

### Performance Optimizations
- [ ] Payment gateway response caching
- [ ] Batch webhook processing
- [ ] Database query optimization
- [ ] CDN integration for payment pages

## Conclusion

The payment gateway integration provides a complete, secure, and user-friendly payment solution for the GamePasal platform. The implementation follows industry best practices for security, reliability, and user experience.

For any issues or questions, refer to the debugging section or contact the development team.
