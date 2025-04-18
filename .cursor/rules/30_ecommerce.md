# Stripe Integration Rules

- Use **Stripe Checkout** for one‑off purchases and **Stripe Customer Portal** for subscription management.
- Add webhook handler `/api/stripe/webhook` for:  
  `invoice.payment_succeeded`, `customer.subscription.updated`, `checkout.session.completed`.
- Keep secret keys in `.env.*`; never hard‑code them. Validate with **dotenv‑safe**.
- Model products in an `inventory` table; store the Stripe Price ID on each SKU row to keep catalogue and Stripe in sync.
