# Appsica E-commerce frontend

A responsive React storefront built with Vite. It includes product discovery,
product details, cart and wishlist interactions, account sign-in/registration,
demo checkout and payment confirmation, order history, and mobile navigation.

## Run locally

Use Node.js 20.19+ or 22.12+ and npm:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Demo shop and payment

The storefront loads sample products from DummyJSON. Its sample USD prices are
converted to approximate INR prices for display. The cart, demo account, demo
orders, and payment receipts are saved in this browser's local storage.

Checkout simulates a successful card, UPI, or cash-on-delivery transaction.
It does not collect payment credentials or charge money. This demo flow is not
a real payment integration and must not be used for production transactions.

## Checks

```sh
npm run lint
npm run build
npm run preview
```
