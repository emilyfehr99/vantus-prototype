# Quick Start Guide

## Step 1: Start the Backend API

Open a terminal and run:
```bash
cd /Users/emilyfehr8/CascadeProjects
python velocity_logic_api.py
```

You should see:
```
🚀 Velocity Logic API Server
==================================================
Database: velocity_logic.db
Starting server on http://localhost:5003
```

## Step 2: Start the Frontend

Open a **new terminal** and run:
```bash
cd /Users/emilyfehr8/CascadeProjects/velocity-logic-dashboard
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Open in Browser

Navigate to `http://localhost:5173` in your browser.

## First Steps

1. **Add a Customer**: Click "Customers" → "New Customer" → Fill in details → Save
2. **Create an Invoice**: Click "Invoices" → "New Invoice" → Select customer → Add items → Save
3. **Record a Payment**: Open an invoice → Click "Add Payment" → Enter amount → Save

That's it! Your dashboard is ready to use.

