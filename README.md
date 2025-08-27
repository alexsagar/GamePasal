# 🎮 GamePasal

GamePasal is a web application for managing online games, payments, and users.  
It is structured with a **backend (Node.js + Express + MongoDB)** and a **frontend (React + TailwindCSS)**.

---

## 📂 Project Structure

```
GamePasal/
│
├── backend/       # Node.js + Express + MongoDB API
│   ├── models/    # Database models (e.g., Users, Orders, Products)
│   ├── routes/    # API routes
│   ├── utils/     # Helper functions (e.g., send OTP, email)
│   └── server.js  # Main entry point
│
├── frontend/      # React frontend (Vite/CRA + TailwindCSS)
│   ├── src/       # Components, pages, hooks, services
│   └── public/    # Static assets
│
└── .gitignore     # Ignore node_modules, .env, build, logs
```

---

## ⚙️ Tech Stack

- **Frontend:** React, TailwindCSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Payments:** Stripe Checkout Integration  
- **Email/OTP:** Nodemailer (Gmail SMTP)  

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/alexsagar/GamePasal.git
cd GamePasal
```

### 2. Setup Environment Variables
Create `.env` in both `backend/` and `frontend/` folders.

#### Example (`backend/.env`)
```
MONGO_URI=your_mongo_connection
JWT_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
STRIPE_SECRET_KEY=your_stripe_secret
```

#### Example (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

> ⚠️ Do **NOT** commit your `.env` files. Only `.env.example` should be tracked.

### 3. Install dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 4. Run development servers

#### Backend
```bash
npm run dev
```

#### Frontend
```bash
npm run dev
```

---

## 🛠️ Features

- User authentication (JWT)  
- Game selection & deposit system  
- Stripe-powered payments  
- OTP & email confirmation (Nodemailer)  
- Admin panel for managing users, products, orders, and banners  

---

## 📦 Deployment

- **Frontend:** Vercel  
- **Backend:** Render / Hostinger  
- **Database:** MongoDB Atlas  

---

## 🤝 Contributing

1. Fork the project  
2. Create a feature branch (`git checkout -b feature/awesome-feature`)  
3. Commit your changes (`git commit -m 'Add some feature'`)  
4. Push to your branch (`git push origin feature/awesome-feature`)  
5. Open a Pull Request  

---

## 📜 License

This project is licensed under the **MIT License** — feel free to use and modify.

---

## 👨‍💻 Author

**[Alex Sagar](https://github.com/alexsagar)**  
