==> Cloning from https://github.com/NachhilfeProjekt/SchulDashboard
==> Checking out commit 3162920ad653a39d8957bf683779017b4d522ec3 in branch main
==> Downloading cache...
==> Transferred 76MB in 7s. Extraction took 2s.
==> Requesting Node.js version 18.x
==> Using Node.js version 18.20.8 via ./backend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Using Bun version 1.1.0 (default)
==> Docs on specifying a bun version: https://render.com/docs/bun-version
==> Running build command 'cd backend && npm install --production=false && npm install --save-dev @types/express @types/cors @types/morgan @types/pg @types/uuid @types/bcryptjs @types/jsonwebtoken @types/winston @types/jest && mkdir -p src/validation && echo 'import Joi from "joi"; export const createUserSchema = Joi.object({ email: Joi.string().email().required(), role: Joi.string().valid("developer", "lead", "office", "teacher").required(), locations: Joi.array().items(Joi.string()).min(1).required() }); export const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }); export const passwordResetSchema = Joi.object({ token: Joi.string().required(), newPassword: Joi.string().min(8).required() });' > src/validation/user.ts && npm run clean && npx tsc --skipLibCheck'...
added 501 packages, and audited 502 packages in 13s
55 packages are looking for funding
  run `npm fund` for details
6 high severity vulnerabilities
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
up to date, audited 174 packages in 1s
18 packages are looking for funding
  run `npm fund` for details
3 high severity vulnerabilities
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
> dashboard-backend@1.0.0 clean
> rm -rf dist/*
src/middleware/authMiddleware.ts(79,1): error TS1184: Modifiers cannot appear here.
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
