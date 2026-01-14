# How to Push This to GitHub

This standalone screensaver is ready to become its own repository! Follow these steps:

## Method 1: Using GitHub Desktop (Easiest)

1. **Download this folder** (`voyeur-standalone`) to your local machine
2. **Open GitHub Desktop**
3. Click **File → Add Local Repository**
4. Select the `voyeur-standalone` folder
5. Click **Publish repository**
6. Name it: `voyeur-screensaver`
7. Add description: "Modern recreation of the classic After Dark Voyeur screensaver"
8. Uncheck "Keep this code private" (or keep it private if you prefer)
9. Click **Publish repository**

Done! Your screensaver is now on GitHub.

## Method 2: Using Git Command Line

1. **Download this folder** to your local machine

2. **Navigate to the folder:**
```bash
cd path/to/voyeur-standalone
```

3. **Initialize git** (if not already done):
```bash
git init
git branch -M main
```

4. **Add all files:**
```bash
git add .
```

5. **Create first commit:**
```bash
git commit -m "Initial commit: Voyeur screensaver v1.0"
```

6. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `voyeur-screensaver`
   - Description: "Modern recreation of the classic After Dark Voyeur screensaver"
   - Public or Private (your choice)
   - **DO NOT** initialize with README (we already have one)
   - Click "Create repository"

7. **Push to GitHub:**
```bash
git remote add origin https://github.com/YOUR-USERNAME/voyeur-screensaver.git
git push -u origin main
```

Done!

## Method 3: Using Claude's Git Tab

If you're in Claude Code:

1. Use the **Git tab** in the sidebar
2. Click **Initialize Repository** (if needed)
3. Stage all files (click the + next to each file)
4. Write commit message: "Initial commit: Voyeur screensaver v1.0"
5. Click **Commit**
6. Click **Push** and follow the prompts to create a new GitHub repository

## Setting Up GitHub Pages (Optional)

To host your screensaver directly on GitHub:

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Pages** section
4. Under "Source", select: **main branch**
5. Click **Save**
6. Wait a few minutes
7. Your screensaver will be live at: `https://YOUR-USERNAME.github.io/voyeur-screensaver/`

## What's Included

This standalone package contains:
- ✅ `index.html` - Main screensaver page
- ✅ `voyeur.js` - Complete animation engine (2785 lines)
- ✅ `audio/` - Audio files directory with placeholder MP3s
- ✅ `README.md` - Complete documentation
- ✅ `LICENSE` - MIT license
- ✅ `.gitignore` - Ignores system files

## Next Steps After Pushing

1. **Add a demo** - Set up GitHub Pages and add the URL to README
2. **Get audio files** - Replace placeholder MP3s with real sounds (see README)
3. **Share it!** - Post on social media, show your friends
4. **Customize** - Make it your own with different colors/timing

## Recommended Repository Settings

- **Topics/Tags:** `screensaver`, `javascript`, `html5-canvas`, `retro`, `after-dark`, `animation`, `web-animation`, `vanilla-js`
- **Website:** Add your GitHub Pages URL once it's live
- **About:** "Modern web-based recreation of the classic 1995 After Dark Voyeur screensaver"

---

Your quirky screensaver is ready for the world! 🎉
