# Torn Signature Banner (Mobster Theme)

Animated GIF signature for Torn.com showing Level, Name, Faction, and Job,
pulled live from the Torn API, rendered as a dark grey/black mobster-themed
banner (fedora + tommy gun figure).

## Setup Guide

### 1. Get a font
Download **Oswald Bold** (free, Google Fonts): https://fonts.google.com/specimen/Oswald
- Grab the `Oswald-Bold.ttf` file
- Place it in this project's `fonts/` folder, so the path is:
  `torn-signature/fonts/Oswald-Bold.ttf`

### 2. Install dependencies
From inside the `torn-signature` folder:
```
npm install
```

### 3. Push to GitHub
```
git init
git add .
git commit -m "Initial commit"
```
Create a new repo on GitHub, then:
```
git remote add origin https://github.com/YOUR_USERNAME/torn-signature.git
git push -u origin main
```

### 4. Deploy on Vercel
1. Go to vercel.com and log into your account
2. Click **Add New → Project**
3. Import the GitHub repo you just pushed
4. Before deploying, open **Environment Variables** and add:
   - Key: `TORN_API_KEY`
   - Value: your Torn API key (Torn → Settings → API Key)
5. Click **Deploy**

### 5. Test it
Once deployed, visit:
```
https://YOUR-PROJECT-NAME.vercel.app/api/signature.gif
```
You should see the animated banner with your live Level, Name, Faction, and
Job. If "Job" or "Faction" show blank, the Torn API's field names may differ
slightly from what's coded — check the raw response at
`https://api.torn.com/user/?selections=profile&key=YOUR_KEY` in a browser
and tell me what the real field is, and I'll fix the mapping.

### 6. Use it as your signature
On Torn's forums, go to your signature settings and use:
```
https://YOUR-PROJECT-NAME.vercel.app/api/signature.gif
```
as the image URL.

## Notes
- The GIF is cached for 5 minutes (`Cache-Control`), so it won't hit the
  Torn API or re-render on every single page view — only refreshes at most
  once every 5 minutes.
- To change colors, text layout, or the figure's pose, edit `api/signature.js`.
