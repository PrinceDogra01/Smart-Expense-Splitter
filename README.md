<<<<<<< HEAD
# Smart Expense Splitter (SplitX)

A complete MERN stack application for splitting expenses among friends, roommates, and trip groups. Built with React, Node.js, Express, MongoDB, and Tailwind CSS.

## Features

### Core Features
- ✅ **User Authentication**: JWT-based secure authentication with register/login
- ✅ **Groups Management**: Create groups (Trip, Roommates, Friends, Other) and manage members
- ✅ **Expense Management**: Add expenses with equal or custom splits
- ✅ **Balance Calculation**: Automatically calculates who owes whom with minimized settlements
- ✅ **Dashboard**: Overview of total spent, amounts to receive/pay, and group summaries
- ✅ **Settlement Tracking**: Mark expenses as settled and maintain settlement history
- ✅ **Payment System**: Razorpay-ready payment integration structure

### Advanced Features
- 📊 Balance summaries per group
- 📱 Fully responsive mobile-first design
- 🌙 Dark mode support
- 🔔 Toast notifications
- 🎨 Modern, clean UI with Tailwind CSS

## Tech Stack

### Frontend
- React.js 18
- React Router v6
- Tailwind CSS
- Axios
- React Hot Toast
- React Icons
- Vite

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- CORS enabled

## Project Structure

```
SplitX/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── expenseController.js
│   │   ├── balanceController.js
│   │   ├── settlementController.js
│   │   └── paymentController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Expense.js
│   │   └── Settlement.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── groups.js
│   │   ├── expenses.js
│   │   ├── balances.js
│   │   ├── settlements.js
│   │   └── payments.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Groups.jsx
│   │   │   └── NewGroup.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

4. Start the MongoDB server (if using local MongoDB):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

5. Start the backend server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register/Login**: Create a new account or login with existing credentials
2. **Create a Group**: Click "New Group" to create a group (Trip, Roommates, Friends, etc.)
3. **Add Members**: Add members to your group (currently requires member user IDs - in production, this would have user search)
4. **Add Expenses**: Add expenses to groups with equal or custom splits
5. **View Balances**: Check who owes whom in the Balances tab
6. **Settle Up**: Create settlements to mark debts as paid

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Groups
- `GET /api/groups` - Get all groups for user (protected)
- `GET /api/groups/:id` - Get a single group (protected)
- `POST /api/groups` - Create a new group (protected)
- `PUT /api/groups/:id` - Update a group (protected)
- `DELETE /api/groups/:id` - Delete a group (protected)
- `PUT /api/groups/:id/members` - Add members to group (protected)
- `DELETE /api/groups/:id/members/:memberId` - Remove member from group (protected)

### Expenses
- `GET /api/expenses` - Get all expenses for user (protected)
- `GET /api/expenses/group/:groupId` - Get expenses for a group (protected)
- `GET /api/expenses/:id` - Get a single expense (protected)
- `POST /api/expenses` - Create a new expense (protected)
- `PUT /api/expenses/:id` - Update an expense (protected)
- `DELETE /api/expenses/:id` - Delete an expense (protected)

### Balances
- `GET /api/balances/summary` - Get user's overall balance summary (protected)
- `GET /api/balances/group/:groupId` - Get balances for a group (protected)

### Settlements
- `GET /api/settlements/group/:groupId` - Get settlements for a group (protected)
- `GET /api/settlements/group/:groupId/suggestions` - Get settlement suggestions (protected)
- `POST /api/settlements` - Create a settlement (protected)
- `PUT /api/settlements/:id` - Update settlement status (protected)

### Payments
- `POST /api/payments/create-order` - Create payment order (Razorpay-ready) (protected)
- `POST /api/payments/verify` - Verify payment (protected)
- `GET /api/payments/history` - Get payment history (protected)

## Notes

- The payment integration is structured for Razorpay but uses mock data. To integrate with Razorpay, add your API keys to the backend `.env` file and uncomment the Razorpay code in `paymentController.js`
- Member addition currently requires user IDs. In production, implement a user search functionality by email/username
- All routes except `/api/auth/register` and `/api/auth/login` require JWT authentication
- The app uses JWT tokens stored in localStorage for authentication

## Development

### Backend
- Uses nodemon for auto-reloading during development
- MongoDB connection handled with Mongoose
- Error handling middleware included
- CORS enabled for frontend communication

### Frontend
- Uses Vite for fast development builds
- Tailwind CSS for styling with dark mode support
- React Router for navigation
- Axios interceptors for automatic token injection
- React Hot Toast for notifications

## License

MIT

## Author

Built with ❤️ using MERN stack

=======
# Smart-Expense-Splitter
>>>>>>> 68061b0e4210cce8a92a13578471f3b125b0f6a1
