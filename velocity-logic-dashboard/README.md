# Velocity Logic Dashboard

A modern invoicing and company dashboard for Velocity Logic - a B2B SaaS company specializing in AI-powered instant quote automation for blue-collar businesses.

## Features

- **Dashboard**: Real-time metrics including MRR, total revenue, customers, and outstanding invoices
- **Invoicing**: Create, edit, and manage invoices with line items, tax calculations, and payment tracking
- **Customer Management**: Maintain a complete customer database with contact information
- **Payment Tracking**: Record and track payments against invoices with automatic status updates
- **Revenue Analytics**: Visual charts showing revenue trends over time

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts
- **Backend**: Flask (Python)
- **Database**: SQLite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd velocity-logic-dashboard
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   # From the root directory
   pip install Flask Flask-CORS
   ```

### Running the Application

1. **Start the backend API server:**
   ```bash
   # From the root directory
   python velocity_logic_api.py
   ```
   The API will run on `http://localhost:5003`

2. **Start the frontend development server:**
   ```bash
   cd velocity-logic-dashboard
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

3. **Open your browser:**
   Navigate to `http://localhost:5173` to access the dashboard

### Environment Variables

Create a `.env` file in the `velocity-logic-dashboard` directory (optional):

```env
VITE_API_URL=http://localhost:5003/api
```

If not set, it defaults to `http://localhost:5003/api`

## Project Structure

```
velocity-logic-dashboard/
├── src/
│   ├── api/
│   │   └── client.js          # API client functions
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar
│   ├── pages/
│   │   ├── Dashboard.jsx       # Main dashboard with metrics
│   │   ├── Invoices.jsx        # Invoice list page
│   │   ├── InvoiceDetail.jsx   # Invoice create/edit/view
│   │   ├── Customers.jsx       # Customer list page
│   │   └── CustomerDetail.jsx  # Customer create/edit
│   ├── App.jsx                 # Main app component with routing
│   └── main.jsx                # Entry point
├── public/
└── package.json
```

## API Endpoints

The backend API provides the following endpoints:

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create an invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/payments` - List all payments
- `POST /api/payments` - Record a payment
- `DELETE /api/payments/:id` - Delete a payment

## Database

The application uses SQLite with the following tables:
- `customers` - Customer information
- `invoices` - Invoice headers
- `invoice_items` - Invoice line items
- `payments` - Payment records

The database file (`velocity_logic.db`) is automatically created on first run.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

Private - Velocity Logic
