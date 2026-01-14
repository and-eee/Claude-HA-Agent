# Voyeur Screensaver - cPanel Deployment Guide

## Quick Setup (5 Minutes)

The screensaver is **100% client-side** (HTML + JavaScript), so it works perfectly on cPanel without needing Python/FastAPI!

### Step-by-Step Instructions

#### 1. Get Your Files

You need these 3 items from the `claude-ha-agent/static/` directory:
- `index.html`
- `voyeur.js`
- `audio/` folder (with all .mp3 files inside)

#### 2. Upload to cPanel

**Via File Manager:**
1. Log into your cPanel
2. Click **File Manager**
3. Navigate to `public_html` (or your domain's root directory)
4. Click **Upload** button
5. Upload:
   - `index.html`
   - `voyeur.js`
6. Create a new folder called `audio`
7. Go into the `audio` folder
8. Upload all 5 .mp3 files

**Via FTP:**
1. Connect to your site with FTP client (FileZilla, etc.)
2. Navigate to `public_html`
3. Upload `index.html` and `voyeur.js`
4. Create `audio` folder
5. Upload all .mp3 files into `audio` folder

#### 3. Final Structure

Your directory should look like this:

```
public_html/
├── index.html          ← Main screensaver page
├── voyeur.js           ← Animation engine
└── audio/              ← Audio files folder
    ├── ambient-city.mp3
    ├── police-siren.mp3
    ├── helicopter.mp3
    ├── thunder.mp3
    └── ufo-whoosh.mp3
```

#### 4. Visit Your Domain

Go to: `https://yourdomain.com`

**The screensaver will play automatically!** 🎉

## Audio Files

The placeholder .mp3 files are empty. For the full experience:

1. **Download real audio** (see options below)
2. **Replace the files** in your `public_html/audio/` folder
3. **Refresh your browser** - audio will work!

### Where to Get Audio (Free):

**Option 1: Freesound.org** (Recommended)
- Search for: "city ambience", "police siren", "helicopter", "thunder", "whoosh"
- Download as MP3
- Free with attribution (CC0 or CC-BY licenses)

**Option 2: Quick Links**
- **Ambient City:** https://freesound.org/search/?q=city+ambience+night
- **Police Siren:** https://freesound.org/search/?q=police+siren+short
- **Helicopter:** https://freesound.org/search/?q=helicopter+distant
- **Thunder:** https://freesound.org/search/?q=thunder+rumble
- **UFO:** https://freesound.org/search/?q=whoosh+sci-fi

**Option 3: Zapsplat.com**
- High-quality sound effects
- Free with account
- Good for vehicle sounds

**Audio Specs:**
- Format: MP3
- Bitrate: 128-192 kbps
- Length: 2-3 seconds for effects, 2-3 minutes for ambient

## Testing

1. **Visit your domain** - Screensaver should load
2. **Wait 30-60 seconds** - Special effects will start appearing
3. **Press M** - Toggle mute/unmute
4. **Resize browser** - Layout adjusts automatically
5. **Try mobile** - Works on phones/tablets too!

## Troubleshooting

### Screensaver doesn't load
- Check file names are exact: `index.html`, `voyeur.js`
- Verify files are in root of domain (public_html)
- Clear browser cache (Ctrl+F5)

### Audio doesn't play
- Click anywhere on page (browser autoplay policy)
- Check audio files are in `audio/` folder
- Replace empty placeholder files with real audio
- Press M to unmute

### Looks broken / white screen
- Check browser console for errors (F12)
- Verify `voyeur.js` uploaded completely (should be ~85 KB)
- Try different browser

### 404 errors for audio
- Verify `audio/` folder exists
- Check folder name is lowercase: `audio` not `Audio`
- Ensure .mp3 files are directly in audio folder

## Customization

### Change Colors
Edit `voyeur.js`, find the `COLORS` object near the top (around line 15)

### Adjust Effect Timing
Edit `voyeur.js`, find the `TIMING` object (around line 30)

### Different Domain/Subdirectory
If installing in a subdirectory (e.g., yourdomain.com/screensaver/):
1. Upload files to `public_html/screensaver/`
2. No code changes needed - everything is relative

## Alternative: Subdomain Setup

Want to use a subdomain like `screensaver.yourdomain.com`?

1. **Create subdomain** in cPanel
2. **Upload files** to subdomain's directory
3. **Visit subdomain** - screensaver plays!

## Performance Tips

### Enable Gzip Compression (Optional)
In cPanel:
1. Go to **Optimize Website**
2. Select **Compress All Content**
3. Save

This makes voyeur.js load faster (~85 KB → ~25 KB)

### Enable Browser Caching (Optional)
Add to `.htaccess` in public_html:

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType audio/mpeg "access plus 1 month"
</IfModule>
```

## SSL/HTTPS Setup

If your domain has SSL (https://):
- Everything works automatically
- No code changes needed
- Audio autoplay works better with HTTPS

If you need SSL:
1. Go to cPanel → **SSL/TLS Status**
2. Enable **Let's Encrypt** (free)
3. Your screensaver will run on HTTPS

## What Works / What Doesn't

✅ **Works on cPanel:**
- Complete screensaver experience
- All 24 animated windows
- All 7 special effects
- Audio system
- Keyboard controls (M for mute)
- Mobile/desktop responsive

❌ **Not needed on cPanel:**
- Python/FastAPI backend (that's for Home Assistant integration)
- Docker
- Node.js
- Build tools

The screensaver is **pure HTML/JavaScript** - it just works!

## File Permissions

If you get permission errors:
1. In cPanel File Manager, right-click files
2. Set permissions:
   - `index.html`: 644
   - `voyeur.js`: 644
   - `audio/` folder: 755
   - `audio/*.mp3`: 644

## Backup

To backup your screensaver:
1. In File Manager, select all files
2. Click **Compress**
3. Choose **Tar Gzip Archive**
4. Download the .tar.gz file

## Need Help?

Common cPanel issues:
- **Files not showing:** Check you're in the right directory (public_html)
- **Domain shows old content:** Clear browser cache
- **Upload fails:** Check disk space quota in cPanel
- **Audio 404s:** Verify audio folder path is correct

## Summary

1. **Upload** index.html, voyeur.js, and audio folder to public_html
2. **Visit** your domain - screensaver plays!
3. **Optional:** Add real audio files for full experience

That's it! No server configuration, no Python, no database - just upload and enjoy! 🎨✨
