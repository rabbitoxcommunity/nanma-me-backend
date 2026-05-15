# Nanma Estates — Backend (REST API + CMS)

Node.js + Express + MongoDB + JWT + Cloudinary backend for the Nanma Estates real-estate website and CMS admin dashboard.

---

## Quick start

```bash
# 1. Install deps
npm install

# 2. Create your local .env from the template
cp .env.example .env

# 3. Edit .env (see "Environment variables" below)
#    – MongoDB Atlas URI
#    – JWT secret
#    – Cloudinary credentials
#    – Default admin email + password

# 4. Seed your first admin
npm run seed:admin

# 5. Run the API
npm run dev    # nodemon, restarts on file change
# or
npm start
```

The API will boot at **http://localhost:5000** and the React frontend at `http://localhost:3001` will pick it up automatically (it reads `REACT_APP_API_URL`).

Visit **http://localhost:3001/admin/login** in your browser and log in with the credentials from `.env`.

---

## Environment variables

`.env` (do **not** commit) — start from `.env.example`:

| Variable | Purpose |
|---|---|
| `PORT` | API port. Default `5000`. |
| `NODE_ENV` | `development` / `production`. |
| `CLIENT_URL` | Origin allowed by CORS. Comma-separate for multiple. |
| `MONGO_URI` | Your MongoDB Atlas connection string. |
| `JWT_SECRET` | Long random string used to sign JWTs (≥ 64 chars). |
| `JWT_EXPIRES_IN` | Token lifetime. Default `7d`. |
| `ADMIN_EMAIL` | Email used by `npm run seed:admin`. |
| `ADMIN_PASSWORD` | Initial admin password (change after first login). |
| `ADMIN_NAME` | Display name for that admin. |
| `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | From your Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard. |
| `PUBLIC_SITE_URL` | Used inside `/sitemap.xml` and `/robots.txt`. |

### Setting up MongoDB Atlas (free tier)
1. Create an account at <https://www.mongodb.com/cloud/atlas>.
2. Create a free **M0** cluster.
3. **Database Access** → add a user with `readWrite` on the `nanma` database.
4. **Network Access** → add `0.0.0.0/0` for development (or your IP).
5. **Connect → Drivers** → copy the connection string and paste it in `MONGO_URI`. Replace `<USER>`, `<PASSWORD>`, and append `/nanma` after the host.

### Setting up Cloudinary (free plan)
1. Sign up at <https://cloudinary.com>.
2. Dashboard → **Account Details** → copy `Cloud Name`, `API Key`, `API Secret` into `.env`.
3. The backend automatically applies `q_auto`, `f_auto`, and `w_2000` transformations to uploaded images, so delivery is optimised by default.

---

## API surface

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns `{ token, admin }`. Rate-limited (8/15 min). |
| GET  | `/api/auth/me` | Returns the current admin (requires `Authorization: Bearer <token>`). |
| POST | `/api/auth/change-password` | Body: `{ currentPassword, newPassword }`. |

### Projects
| Method | Path | Description |
|---|---|---|
| GET  | `/api/projects/public` | Public list. Query: `status`, `featured`, `q`, `page`, `limit`. |
| GET  | `/api/projects/public/:slug` | Public single project. |
| GET  | `/api/projects` | (auth) Admin list. |
| GET  | `/api/projects/:id` | (auth) Admin single. |
| POST | `/api/projects` | (auth) Create. Slug auto-generates from `name`. |
| PUT  | `/api/projects/:id` | (auth) Update. |
| DELETE | `/api/projects/:id` | (auth) Delete (also cleans Cloudinary media). |
| POST | `/api/projects/:id/featured-image` | (auth, multipart `file`) Replace featured image. |
| POST | `/api/projects/:id/gallery` | (auth, multipart `files[]`) Append gallery images. |
| DELETE | `/api/projects/:id/gallery/:publicId` | (auth) Remove a gallery image. |

### Gallery
| Method | Path | Description |
|---|---|---|
| GET  | `/api/gallery/public?category=` | Public list. |
| GET  | `/api/gallery` | (auth) Admin list. |
| POST | `/api/gallery/upload-image` | (auth, multipart `file`) Upload image. |
| POST | `/api/gallery/upload-video` | (auth, multipart `file`) Upload video. |
| POST | `/api/gallery/youtube` | (auth) Add YouTube embed. |
| PUT  | `/api/gallery/:id` | (auth) Edit metadata. |
| DELETE | `/api/gallery/:id` | (auth) Delete. |

### Enquiries
| Method | Path | Description |
|---|---|---|
| POST | `/api/enquiries` | Public submit. Rate-limited (12/hour). |
| GET  | `/api/enquiries` | (auth) List with filters. |
| GET  | `/api/enquiries/:id` | (auth) Single. |
| PUT  | `/api/enquiries/:id` | (auth) Update `status` / `notes`. |
| DELETE | `/api/enquiries/:id` | (auth) Delete. |

### Stats
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats/dashboard` | (auth) Counts + recent enquiries for the admin dashboard. |

### SEO files
| Method | Path | Description |
|---|---|---|
| GET | `/sitemap.xml` | Dynamic sitemap including all published projects. |
| GET | `/robots.txt`  | Standard robots — disallows `/admin` and `/api`. |

---

## Folder layout

```
nanma-backend/
├── server.js                 boots Express + Mongo
├── .env.example
├── package.json
└── src/
    ├── app.js                Express app, security middleware, route mounting
    ├── config/
    │   ├── db.js             MongoDB connection
    │   └── cloudinary.js     Cloudinary client
    ├── models/
    │   ├── Admin.js
    │   ├── Project.js        17+ fields, repeaters, slug auto-gen
    │   ├── Gallery.js
    │   └── Enquiry.js
    ├── middleware/
    │   ├── auth.js           JWT sign + verify, role guard
    │   ├── upload.js         Multer + multer-storage-cloudinary (image + video)
    │   └── errorHandler.js
    ├── controllers/
    │   ├── authController.js
    │   ├── projectController.js
    │   ├── galleryController.js
    │   ├── enquiryController.js
    │   └── statsController.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── projects.routes.js
    │   ├── gallery.routes.js
    │   ├── enquiries.routes.js
    │   └── stats.routes.js
    └── utils/
        ├── seedAdmin.js      `npm run seed:admin`
        └── sitemap.js        sitemap.xml + robots.txt builders
```

---

## Security (built in)

- **Helmet** – sets sensible HTTP security headers.
- **CORS** – restricted to `CLIENT_URL` (comma-separated for multiple origins).
- **Rate limits** – global 600/15min on `/api`, 8/15min on login, 12/hour on enquiry submission.
- **express-mongo-sanitize** – strips `$`/`.` operators from query/body.
- **bcrypt** – password hashing (cost 12).
- **JWT** – HS256, 7-day expiry by default.
- **Body limits** – 1MB on JSON / urlencoded; 8MB images, 50MB videos enforced by Multer.
- **`trust proxy`** – correct `req.ip` behind proxies (for rate limit + audit).

For production, also:
- Use a managed reverse proxy (e.g. Nginx) and terminate TLS there.
- Store secrets in your platform's secret manager (Render / Railway / Heroku config vars).
- Tighten CORS to your real domain only.

---

## Deploy notes

The backend is platform-agnostic. A typical setup:

1. Push to a GitHub repo.
2. Connect it to Render / Railway / Fly / Heroku.
3. Add **all** the env vars from `.env.example` in the platform's dashboard.
4. Build command: *(none)* — start command: `node server.js`.
5. Set the React frontend's `REACT_APP_API_URL` to the deployed API URL and redeploy the frontend.
