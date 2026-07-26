# Training Table — iOS (Capacitor)

Storage already converted to Capacitor Preferences (native, survives iOS storage cleanup).

On a Mac:
1. Install Node.js LTS (nodejs.org) and Xcode (Mac App Store, then open once to accept licenses)
2. Terminal in this folder:
   npm install
   npm run build
   npx cap add ios
   npx cap sync
   npx cap open ios
3. In Xcode: select your iPhone as target, set Team under Signing & Capabilities, press Run.

Updates later: edit src/App.jsx, then: npm run ios  (builds, syncs, opens Xcode) and press Run.
