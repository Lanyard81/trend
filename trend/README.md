# Training Table

Your weight-loss tracker as a standalone web app: daily log, dashboard, habits, weekly schedule, customisable meal plan, profile with calorie targets, and photo check-ins.

## Deploy (no coding required)

1. Create a free account at github.com
2. Create a new repository (call it training-table, keep it Private)
3. Upload all files/folders from this project (drag and drop onto the repo page) — everything EXCEPT node_modules and dist if present
4. Create a free account at vercel.com — sign up "with GitHub"
5. Click "Add New → Project", import your training-table repo
6. Vercel auto-detects Vite. Click Deploy. Two minutes later you get a URL like training-table-xyz.vercel.app
7. Open that URL in Safari on your iPad → Share → Add to Home Screen

## Updating the app later

Edit any file directly on GitHub (or ask Claude for changed code, paste it in). Every save auto-redeploys in ~1 minute.

## Your data

- Stored in the browser on each device (localStorage). Each device has its own data.
- Use Me → Backup → Export regularly. Import restores it anywhere.
- Don't clear Safari website data for your app's domain, or the data goes with it.

## Run locally (optional, needs Node.js)

    npm install
    npm run dev
