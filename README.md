# TRIPLE-E Folder Management System

Complete local-ready folder/document management system for RCT using **React + Vite**, **Node.js + Express**, **Prisma**, and **PostgreSQL**.

## 1. Requirements
- Node.js 20+ (Node 22 recommended)
- PostgreSQL 14+

## 2. PostgreSQL setup
Create a database named `triple_e_db` and make sure your PostgreSQL credentials match `backend/.env`.

Default local URL:
`postgresql://postgres:postgres@localhost:5432/triple_e_db?schema=public`

Change it when your PostgreSQL username/password/port differs.

## 3. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```
Backend runs on `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`

Seeded administrator:
- Email: `admin@triple-e.local`
- Password: `Admin@12345`

Change the password immediately after first login.

## 4. Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## 5. Project behavior
Categories seeded: **Policy, Gallery, Program, IDH, IRVC**.

Included functionality:
- JWT login/session
- PostgreSQL + Prisma data layer
- Role-based access control and permissions
- Super Admin / Admin / User roles
- Dashboard statistics and recent documents
- Categories
- Hierarchical folders
- Document upload, search, details and delete
- Profile and password change
- User administration
- Audit logs
- System settings
- Local file storage under `backend/uploads`
- CORS and production environment variables

## 6. Render deployment
### Backend service
Root directory: `backend`
Build command:
```bash
npm install && npx prisma generate && npx prisma db push
```
Start command:
```bash
npm start
```
Environment variables:
- `NODE_ENV=production`
- `DATABASE_URL=<Render PostgreSQL external/internal connection string>`
- `JWT_SECRET=<strong random secret>`
- `JWT_EXPIRES_IN=7d`
- `FRONTEND_URL=<your Vercel URL>`
- `MAX_FILE_SIZE_MB=25`

Run the seed once against the production database using the Render shell:
```bash
npm run prisma:seed
```

### Frontend service (Vercel)
Root directory: `frontend`
Build command:
```bash
npm install && npm run build
```
Output directory:
`dist`
Environment variable:
`VITE_API_URL=https://<your-render-backend>/api`

## 7. Important storage note
The provided default storage is local disk. On Render, local disk is ephemeral unless you attach persistent storage. For production documents that must survive redeploys, replace/extend `storageService.js` with Cloudinary, S3, Cloudflare R2, or another persistent object-storage provider. The environment file already contains optional Cloudinary variables for that extension.

## 8. No extra application files are required
The structure intentionally follows the requested directories/files. `middleware`, `routes`, `utils`, `assets`, and `public` remain available as requested; routing/middleware logic is centralized in the existing `src/app.js` so the requested file list is not expanded.
