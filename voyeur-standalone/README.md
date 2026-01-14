# Voyeur Screensaver

A modern web-based recreation of the classic 1995 "After Dark - Totally Twisted - Voyeur" screensaver by Berkeley Systems. Watch a living, breathing apartment building with 24 unique animated window vignettes and delightful special effects!

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-none-green.svg)
![Pure JavaScript](https://img.shields.io/badge/vanilla-JavaScript-yellow.svg)

## ✨ Features

- **24 Unique Animated Windows** - Each with its own story and personality
- **7 Special Effects** - UFOs, police lights, shooting stars, helicopter spotlights, lightning, airplanes, and dynamic lighting
- **Smooth 60fps Animation** - Professional-quality canvas rendering
- **Fully Responsive** - Works on any screen size from mobile to 4K
- **Audio System** - Ambient city sounds with event-triggered effects
- **No Dependencies** - Pure vanilla JavaScript, no frameworks required
- **Easy Deployment** - Just upload to any web host!

## 🚀 Quick Start

### Option 1: Just Open It

1. Download this repository
2. Open `index.html` in your browser
3. Enjoy! 🎉

### Option 2: Local Server (Recommended)

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve

# Then visit: http://localhost:8000
```

### Option 3: Deploy to Web Host

**For cPanel / Traditional Hosting:**
1. Upload `index.html`, `voyeur.js`, and `audio/` folder to your public_html
2. Visit your domain - it works immediately!

**For GitHub Pages:**
1. Fork this repository
2. Go to Settings → Pages
3. Select main branch as source
4. Your screensaver will be live at `https://yourusername.github.io/voyeur-screensaver/`

**For Netlify/Vercel:**
1. Drag and drop this folder into Netlify or Vercel
2. Done! Your screensaver is live.

## 🎮 Controls

- **M key** - Toggle mute/unmute audio
- **Click anywhere** - Start audio (if blocked by browser autoplay policy)
- Just sit back and watch the show!

## 🏢 The 24 Window Vignettes

Each window tells a different story:

### Everyday Life
1. **Aerobics Person** - Energetic jumping jacks and stretches
2. **TV Watcher** - Head bobbing while binge-watching
3. **Chef** - Flipping food (and occasionally dropping it!)
4. **Plant Enthusiast** - Obsessively watering each plant
5. **Artist** - Painting on easel with changing colors
6. **Reader** - Quietly reading with occasional page turns

### Pets & Animals
7. **Cat & Laser** - Endlessly chasing that red dot
8. **Dog Waiting** - Loyal pup waiting by window, tail wagging
9. **Fish Tank** - Colorful fish swimming with rising bubbles
10. **Bird in Cage** - Hopping between perches

### Romance & Social
11. **Dancing Couple** - Romantic slow dance with elegant spins
12. **Arguing Couple** - Dramatic gestures and heated discussion
13. **Party Scene** - Dancing figures with floating balloons
14. **Phone Pacer** - Pacing back and forth during intense call

### Rest & Relaxation
15. **Sleeping Person** - Peaceful sleep with floating Z's
16. **Yoga/Meditation** - Serene lotus position with stretches
17. **Bathtub** - Relaxing soak with rising bubbles

### Tech & Gaming
18. **Intense Gamer** - Leaning and rocking with occasional victory pose
19. **Late Night Worker** - Typing away with screen glow

### Quirky & Unexpected
20. **Magician** - Rabbit appearing and disappearing from hat!
21. **Juggler** - Juggling three balls (sometimes drops one)
22. **Telescope Watcher** - Observing stars, reacts excitedly to UFO!
23. **Shadow Puppets** - Hand shapes morphing on wall
24. **Disco Ball** - Spinning mirror ball with colored light spots

## 🌟 Special Effects

Random events that appear throughout:

1. **UFO** (every 45-90 sec) - Flying saucer with mint-green beam, makes telescope watcher react!
2. **Police Car** (every 60-120 sec) - Red and blue flashing lights at street level
3. **Shooting Star** (every 90-180 sec) - Quick streak across the night sky with trail
4. **Helicopter Spotlight** (every 2-4 min) - Bright searchlight sweeping across building
5. **Lightning & Thunder** (every 90-180 sec) - Sky flashes white, thunder rumbles after
6. **Airplane** (every 60-120 sec) - Silhouette with blinking wing lights
7. **Window Lights** (continuous) - Windows randomly turn on/off as residents come and go

## 🎵 Audio Setup

The screensaver includes placeholder audio files. For the full experience with sound:

### Where to Get Free Audio:

**Recommended: [Freesound.org](https://freesound.org)**
- Search for: "city ambience", "police siren", "helicopter", "thunder", "whoosh"
- Download as MP3 (CC0 or CC-BY licenses)
- Replace files in `audio/` folder

**Files Needed:**
- `ambient-city.mp3` (2-3 minutes, looping background ambience)
- `police-siren.mp3` (2-3 seconds, brief siren)
- `helicopter.mp3` (5-8 seconds, rotor sound)
- `thunder.mp3` (3-4 seconds, rumble)
- `ufo-whoosh.mp3` (2-3 seconds, sci-fi sound)

**Alternative Sources:**
- [Zapsplat.com](https://zapsplat.com) (free with account)
- [OpenGameArt.org](https://opengameart.org) (game sound effects)
- AI generation (ElevenLabs, AudioCraft)

The screensaver works great even without audio!

## 🎨 Customization

### Change Colors

Edit `voyeur.js` and find the `COLORS` object (around line 15):

```javascript
const COLORS = {
    sky: {
        top: '#0a0520',      // Change night sky colors
        mid: '#1a1a3e',
        horizon: '#2d1b4e'
    },
    building: {
        main: '#2a2a2a',     // Change building color
        // ...
    }
};
```

### Adjust Effect Timing

Edit the `TIMING` object (around line 30):

```javascript
const TIMING = {
    ufo: { min: 45000, max: 90000 },     // Make UFO appear more/less often
    police: { min: 60000, max: 120000 }, // Adjust police timing
    // ...
};
```

## 🛠️ Technical Details

- **Pure Vanilla JavaScript** - No frameworks, no build tools
- **HTML5 Canvas** - Smooth 60fps animation
- **Web Audio API** - Spatial audio with volume control
- **Responsive Design** - Works on any device
- **Frame-Independent Animation** - Smooth on any refresh rate
- **File Size:** ~85 KB (JavaScript) + ~1-2 MB (audio files)

## 📁 Project Structure

```
voyeur-screensaver/
├── index.html          # Main HTML page
├── voyeur.js           # Complete animation engine (2785 lines)
├── audio/              # Audio files directory
│   ├── ambient-city.mp3
│   ├── police-siren.mp3
│   ├── helicopter.mp3
│   ├── thunder.mp3
│   └── ufo-whoosh.mp3
└── README.md           # This file
```

## 🌐 Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## 📜 License

MIT License - Feel free to use, modify, and share!

This is a tribute to the classic 1995 "After Dark - Totally Twisted - Voyeur" screensaver by Berkeley Systems. This modern recreation is an independent project and is not affiliated with or endorsed by the original creators.

## 🙏 Credits

- **Original Concept:** Berkeley Systems (1995)
- **Modern Recreation:** Built with love for nostalgic screensavers
- **Technology:** HTML5 Canvas, Vanilla JavaScript, Web Audio API

## ❓ FAQ

**Q: Does this work offline?**
A: Yes! Once loaded, everything runs client-side.

**Q: Can I use this commercially?**
A: Yes, MIT license allows commercial use.

**Q: Why is audio not playing?**
A: Browser autoplay policies require user interaction. Click anywhere to start audio, or press M to unmute.

**Q: Can I embed this in another website?**
A: Yes! Use an iframe or include the files directly.

---

**Enjoy the quirky world of the Voyeur screensaver!** 🏙️✨
