# AgriFlow

Rent the machine, skip the cost. AgriFlow lists farm machines you can rent, then lets you sign up and log in with a phone number.

The site uses a blue theme, large type, and English and Hindi on every page. After login you can sort machines by availability, cost, and days, or list a machine of your own.

## What you need

- Node.js 22 or newer (the API uses Node's built-in SQLite)

## Start

The website and the API are separate apps inside `agriflow`.

```bash
cd agriflow
npm install
npm install --prefix frontend
npm install --prefix backend
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:4000

Open the app on a phone on the same Wi-Fi by using the Network address Vite prints.

To rebuild the sample data:

```bash
npm run reset-data
```

Restart the API after that. The database file is `agriflow/backend/data/farmshare.sqlite`.

## Demo accounts

Password for every demo account: `demo123`

| Name | Role | Phone |
| --- | --- | --- |
| Ramesh Patel | Farmer (Borsad, Anand) | 9800000001 |
| Sita Ben Parmar | Farmer (Lambhvel) | 9800000002 |
| Mahesh Desai | Owner (Gamdi, about 3 km) | 9800000011 |
| Kheda Custom Hiring Center | Owner (Nadiad, about 18 km) | 9800000012 |
| Jayesh Chauhan | Owner (Karamsad, about 5 km) | 9800000014 |
| Farida Sheikh | Owner (Vadodara, about 35 km) | 9800000013 |
| Anand Mahila Cooperative | Cooperative | 9800000021 |

Ramesh already has a saved location, so nearby machines show as soon as you sign in. Try radius 5 km, 25 km, and 50 km. The Vadodara tractor appears at 50 km. One thresher is turned off, so it stays off the nearby list.

The landing page has one-tap buttons for the farmer, owner, and cooperative demos.

## Try the booking

1. Sign in as Ramesh.
2. Tap **Book Now** on a machine.
3. Dates default to the next two days. Tap **Send request**.
4. Sign in as the owner (Mahesh `9800000011` or Kheda `9800000012`).
5. Accept or decline. After accept, Call, WhatsApp, and SMS open with a ready message.
6. The owner can mark the work finished, then both sides can leave a rating.

A confirmed booking blocks the same dates. A second request for those dates is refused. If two requests overlap and one is accepted, the other is declined automatically.

The cooperative account can split a booking across Ramesh and Sita. Add more farmers from Profile with their phone number. They need a farmer account first.

## Money and impact

Each listing shows a fair-price hint (the average daily rate for that machine type within 50 km, or a typical local rate if there are not two nearby examples) and a line in the form: renting for 2 days costs ₹X vs buying for ₹Y.

The home screen counts:

- farmers helped (confirmed or finished bookings)
- machine hours shared (finished bookings, 8 hours a day)
- money saved by farmers (about 30% less than a middleman usually charges)
- earnings for owners (confirmed and finished bookings)

## Languages and slow networks

The language control (EN / हि / ગુ) is on every page. Wording stays short. Most choices are buttons or dropdowns.

Pages do not load a webfont. Hindi and Gujarati use the phone's own fonts (Noto on Android, Nirmala UI on Windows). Machine pictures are small local SVGs with lazy loading. The map loads only when you tap Map, and uses Leaflet with OpenStreetMap.

Forgot password shows a 4-digit code on screen because this demo has no SMS provider. Confirmed bookings open the phone's WhatsApp or SMS app; notices are always saved inside the app.

## Folder structure

```
agriflow/frontend          React website
agriflow/backend           Express API
agriflow/schema.sql        PostgreSQL version of the data model
agriflow/backend/src       Auth, equipment, bookings, reviews
agriflow/frontend/src      Pages, English and Hindi
```

## Data model

Users, groups, group members, equipment, bookings, booking members, reviews, saved equipment, notifications, and password resets. See `agriflow/schema.sql` for the PostgreSQL form. The running app uses the same tables in SQLite so you do not need to install PostgreSQL.

Passwords are hashed with bcrypt. Sign-in returns a JWT kept in the browser.

## Production-style run

```bash
cd agriflow
npm start
```

This builds the frontend and serves it from the API on port 4000. Set `JWT_SECRET` and `PORT` in the environment before you share it.
