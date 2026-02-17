
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

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

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


1. **Register/Login**: Create a new account or login with existing credentials
2. **Create a Group**: Click "New Group" to create a group (Trip, Roommates, Friends, etc.)
3. **Add Members**: Add members to your group (currently requires member user IDs - in production, this would have user search)
4. **Add Expenses**: Add expenses to groups with equal or custom splits
5. **View Balances**: Check who owes whom in the Balances tab
6. **Settle Up**: Create settlements to mark debts as paid



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

Prince Kumar
Built with ❤️ using MERN stack

