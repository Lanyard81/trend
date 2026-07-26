# Training Table — Desktop App

Turn this project into a standalone executable that keeps your data permanently on your computer.

## One-time setup
1. Install Node.js LTS from nodejs.org (big green button, default options)
2. Unzip this folder somewhere permanent (e.g. Documents)
3. Open a terminal in the folder:
   - Windows: open the folder in File Explorer, type "cmd" in the address bar, press Enter
   - Mac: right-click the folder in Finder > Services > New Terminal at Folder
4. Run:  npm install        (one-time, ~2 minutes)

## Run the app
   npm run app

## Build a real executable
   npm run dist

Find it in the "release" folder:
- Windows: Training Table.exe — a single portable file, copy it anywhere, double-click to run
- Mac: Training Table.dmg — open and drag to Applications

## Your data
Data saves automatically to your user profile on this computer
(Windows: %APPDATA%/training-table · Mac: ~/Library/Application Support/training-table).
It survives app updates, moves and restarts. Use Me > Backup > Export for extra safety
or to move data between the desktop app, the website and your iPad.
