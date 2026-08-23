# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Production API configuration

The API verifies private requests with Firebase Admin and uses MongoDB transactions
to reserve lesson slots safely. Configure these variables on the API host (Render
and/or Vercel):

- `MONGO_URI`: a MongoDB Atlas/replica-set connection string. Transactions are required.
- `CLIENT_URL`: the deployed frontend origin. Separate multiple origins with commas.
- `FIREBASE_PROJECT_ID`: the Firebase project ID used by the frontend.
- Firebase Admin credentials, using `FIREBASE_SERVICE_ACCOUNT` (JSON),
  `FIREBASE_SERVICE_ACCOUNT_BASE64`, or `FIREBASE_CLIENT_EMAIL` plus
  `FIREBASE_PRIVATE_KEY`.
- First-admin allowlist: `ADMIN_UID` (preferred for an existing Firebase user), or
  `ADMIN_EMAIL` (the exact address must be verified in Firebase).
- `BOOKING_HOLD_MINUTES`: optional; defaults to `15` and is limited to 5-60 minutes.
- `PAYPAL_CLIENT_ID`: PayPal app client ID (use a Sandbox app while testing).
- `PAYPAL_CLIENT_SECRET`: PayPal app secret; server-only and never a `VITE_` value.
- `PAYPAL_ENVIRONMENT`: `sandbox` for testing or `live` after production approval.
- `PAYPAL_ORDER_HOLD_MINUTES`: optional; defaults to `30` and is limited to 15-60 minutes.

### Vercel Firebase Admin setup

1. In Firebase Console, open **Project settings > Service accounts** and generate a
   new private key for the same project used by the frontend.
2. Convert the downloaded JSON to Base64 in PowerShell:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\service-account.json'))
   ```

3. In **Vercel > Project > Settings > Environment Variables**, add
   `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_BASE64` for Production (and
   Preview when needed).
4. Redeploy after changing environment variables; Vercel does not apply new values
   to an existing deployment.

Never place Firebase Admin credentials in a `VITE_` variable or commit them to Git.
With `ADMIN_EMAIL`, create the account at `/admin/setup`, verify the email, and sign
in at `/admin/login`. With `ADMIN_UID`, create the Firebase user first and sign in
directly at `/admin/login`.

### PayPal Sandbox setup

1. In the PayPal Developer Dashboard, create or select a Sandbox REST app and copy
   its Client ID and Secret.
2. Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and
   `PAYPAL_ENVIRONMENT=sandbox` to the local `server/.env` and to the Vercel
   Production/Preview environment variables. Do not commit either credential.
3. Restart the local API or redeploy Vercel after changing the variables.
4. Use a PayPal Sandbox personal test account at checkout. A successful capture
   enrolls the course, confirms its reserved lesson slots, and stores a paid
   receipt with PayPal order/capture references.

The browser receives only the public Client ID. The server creates and captures
orders, recalculates the payable total from MongoDB pricing, and enrolls the user
only after PayPal reports a completed capture.
