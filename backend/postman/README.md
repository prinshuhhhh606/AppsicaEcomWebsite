# 📬 AppsicaEcom - Complete Postman Collection Guide

This folder contains the complete, production-ready **Postman Collection (v2.1.0)** and **Postman Environment** for the **AppsicaEcom Multi-Vendor E-Commerce Platform**.

---

## 📁 Files Included

1. **`AppsicaEcom.postman_collection.json`**
   - Contains all **94 API Endpoints** across **13 functional modules**.
   - Fully configured with request bodies, query parameters, headers, and descriptions.
   - Built-in **Postman Test Scripts** that **automatically extract & store JWT tokens** upon logging in!

2. **`AppsicaEcom.postman_environment.json`**
   - Pre-configured variables: `base_url`, `user_token`, `admin_token`, `vendor_token`, `delivery_token`, and resource IDs (`product_id`, `order_id`, etc.).

---

## 🚀 How to Import into Postman (3 Steps)

1. Open **Postman**.
2. Click on the **Import** button (top-left).
3. Drag & drop or select both files:
   - `AppsicaEcom.postman_collection.json`
   - `AppsicaEcom.postman_environment.json`
4. Select the environment **"AppsicaEcom Local / Render Environment"** in the top-right environment selector.

---

## 🔑 Pre-configured Demo Accounts & Roles

The collection is organized by **Role-Based Access Control (RBAC)**:

| Role | Email | Password | Auto-Saved Token Variable |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@appsica.com` | `admin123` | `{{admin_token}}` |
| **Customer** | `user@appsica.com` | `user123` | `{{user_token}}` |
| **Approved Vendor** | `vendor@appsica.com` | `vendor123` | `{{vendor_token}}` |
| **Delivery Partner** | `delivery@appsica.com` | `delivery123` | `{{delivery_token}}` |

> ⚡ **Pro-Tip**: When you run the **Login** request for any role, the test script automatically captures the token from the response and saves it to the environment. All subsequent requests under that module will work without copying/pasting tokens!

---

## 📂 Collection Structure (13 Modules / 94 Endpoints)

### `0. Server Health Check`
- `GET /` — Verify server status, database connection, and API version.

### `1. Authentication & Profile`
- `POST /api/auth/register` — Customer registration
- `POST /api/auth/login` — Customer login *(auto-saves `{{user_token}}`)*
- `GET /api/auth/profile` — Get authenticated user profile
- `PUT /api/auth/profile` — Update user profile
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password using token

### `2. Products & Catalog (Public)`
- `GET /api/products` — Filter, paginate, and sort products
- `GET /api/products/featured` — Homepage featured products
- `GET /api/products/search?q=audio` — Full-text catalog search
- `GET /api/products/category/:slug` — Products filtered by category
- `GET /api/products/:id` — Single product details
- `GET /api/products/:id/reviews` — Customer reviews for product
- `POST /api/products/:id/reviews` — Submit verified product review *(Auth required)*

### `3. Categories (Public)`
- `GET /api/categories` — List all active categories
- `GET /api/categories/:slug` — Category metadata

### `4. Cart Management`
- `GET /api/cart` — View user shopping cart
- `POST /api/cart` — Add product to cart with variants
- `PUT /api/cart/:itemId` — Update quantity
- `DELETE /api/cart/:itemId` — Remove item from cart
- `DELETE /api/cart` — Clear entire cart

### `5. Wishlist Management`
- `GET /api/wishlist` — View customer wishlist
- `POST /api/wishlist` — Add product to wishlist
- `DELETE /api/wishlist/:productId` — Remove from wishlist
- `GET /api/wishlist/check/:productId` — Check bookmark status

### `6. Address Book`
- `GET /api/addresses` — List saved shipping addresses
- `POST /api/addresses` — Add new shipping address
- `PUT /api/addresses/:id` — Update address details
- `PUT /api/addresses/:id/default` — Mark address as primary
- `DELETE /api/addresses/:id` — Delete address

### `7. Checkout & Coupons`
- `POST /api/checkout/summary` — Real-time price, tax, discount calculations
- `POST /api/checkout/coupon` — Validate and apply coupon code (`WELCOME10`, `APPSICA20`)
- `DELETE /api/checkout/coupon` — Remove applied coupon
- `GET /api/checkout/delivery` — Shipping methods and charges
- `POST /api/checkout/place-order` — Place order from cart

### `8. Customer Orders & Tracking`
- `GET /api/orders` — Customer order history
- `GET /api/orders/:id` — Single order details
- `GET /api/orders/:id/track` — Real-time tracking status timeline
- `PUT /api/orders/:id/cancel` — Cancel order and restock inventory
- `POST /api/orders/:id/return` — Request return/refund

### `9. Payments Gateway Simulation`
- `POST /api/payments/initiate` — Create payment transaction intent
- `POST /api/payments/verify` — Verify gateway callback / signature
- `GET /api/payments/:paymentId` — Check transaction status

### `10. Vendor Central (Multi-Seller)`
- `POST /api/vendor/register` — Vendor self-registration
- `POST /api/vendor/login` — Vendor login *(auto-saves `{{vendor_token}}`)*
- `GET /api/vendor/profile` — Store profile and bank details
- `PUT /api/vendor/profile` — Update store details & payout bank info
- `GET /api/vendor/dashboard` — Sales, orders, and pending shipment analytics
- `GET /api/vendor/products` — Vendor catalog list
- `POST /api/vendor/products` — Publish new product *(Approved vendor)*
- `PUT /api/vendor/products/:id` — Edit pricing and inventory
- `DELETE /api/vendor/products/:id` — Delete product
- `GET /api/vendor/orders` — Orders containing vendor's items
- `PUT /api/vendor/orders/:id/status` — Update item status (`Processing`)
- `GET /api/vendor/reports` — Commission deduction and net payout ledger
- `GET /api/vendor/reviews` — Customer reviews on vendor items
- `POST /api/vendor/reviews/:id/reply` — Vendor public response to review

### `11. Delivery Fleet Partner Portal`
- `POST /api/delivery/register` — Rider self-registration
- `POST /api/delivery/login` — Rider login *(auto-saves `{{delivery_token}}`)*
- `GET /api/delivery/profile` — Rider credentials & vehicle information
- `PUT /api/delivery/toggle-availability` — Toggle Online/Offline duty status
- `PUT /api/delivery/location` — Push live GPS coordinates
- `GET /api/delivery/dashboard` — Trips, earnings, and delivery stats
- `GET /api/delivery/assigned-orders` — Active orders assigned for delivery
- `PUT /api/delivery/order/:id/accept` — Accept order dispatch
- `PUT /api/delivery/order/:id/arrive-pickup` — Arrive at merchant pickup location
- `PUT /api/delivery/order/:id/confirm-pickup` — Confirm parcel collected
- `PUT /api/delivery/order/:id/out-for-delivery` — Mark out for delivery *(generates customer OTP)*
- `PUT /api/delivery/order/:id/verify-otp` — Verify customer delivery OTP & mark Delivered
- `GET /api/delivery/history` — Completed trip history
- `GET /api/delivery/earnings` — Rider per-order delivery fee payouts

### `12. Super Admin Portal (Full RBAC)`
- `POST /api/auth/login` *(Admin)* — Admin authentication *(auto-saves `{{admin_token}}`)*
- `GET /api/admin/dashboard` — Global marketplace analytics
- `GET /api/admin/products` — All catalog items across all sellers
- `PUT /api/admin/products/:id/approval` — Moderate seller product (Approve/Reject)
- `POST /api/admin/products` — Admin in-house product creation
- `POST /api/admin/categories` — Create category
- `GET /api/admin/orders` — Master orders ledger
- `PUT /api/admin/orders/:id/assign-delivery` — Assign fleet delivery partner
- `GET /api/admin/customers` — Customer accounts registry
- `GET /api/admin/vendors` — Seller accounts registry
- `PUT /api/admin/vendors/:id/status` — Approve/Reject seller store
- `GET /api/admin/delivery-partners` — Fleet riders registry
- `PUT /api/admin/delivery-partners/:id/status` — Approve/Reject delivery rider
- `GET /api/admin/payouts` — Seller payout requests
- `POST /api/admin/payouts` — Create seller payout disbursement
- `GET /api/admin/returns` — Customer return disputes
- `PUT /api/admin/returns/:id/status` — Approve/Reject return & process refund
- `GET /api/admin/coupons` — Promotional discount coupons
- `POST /api/admin/coupons` — Create promotional coupon
- `GET /api/admin/audit-logs` — Immutable platform security audit trail
- `GET /api/admin/settings` — Platform commission % and tax configuration
- `PUT /api/admin/settings` — Update platform settings
- `GET /api/admin/reports` — Exportable reporting dataset

---

## 🌐 Testing on Localhost vs Render Production

To switch from testing on **Localhost** to testing on **Render**:
1. Open the **AppsicaEcom Local / Render Environment** in Postman.
2. Change the `base_url` variable:
   - For Local testing: `http://localhost:5000`
   - For Render testing: `https://your-app-name.onrender.com`
3. Click **Save**. All 94 endpoints will automatically route to your chosen server!
