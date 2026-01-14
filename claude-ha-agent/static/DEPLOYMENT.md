# Voyeur Screensaver - Deployment Guide

## Overview

A polished recreation of the classic "After Dark - Totally Twisted - Voyeur" screensaver as a full-screen web experience. Features 24 animated window vignettes, 7 special effects, and ambient audio.

## What's Been Implemented

✅ **Complete Screensaver System:**
- 24 unique animated window vignettes (people, pets, activities)
- 7 special effects (UFO, police lights, shooting stars, helicopter, lightning, airplane, window toggles)
- Responsive canvas rendering (works on any screen size)
- Audio system with ambient sounds and event-triggered effects
- Event scheduling system with random timing
- Smooth 60fps animations using requestAnimationFrame
- Keyboard controls (M key for mute)

✅ **Files Created:**
- `/static/index.html` - Main screensaver page
- `/static/voyeur.js` - Complete animation engine (2785 lines)
- `/static/audio/` - Audio files directory with README
- Updated `app/main.py` - Added static file serving
- Updated `Dockerfile` - Includes static directory

## Quick Start

### Option 1: Run Locally (Development)

From the `claude-ha-agent` directory:

```bash
# Make sure you're in the right directory
cd /workspace/cmkdil20000rrintm90t60wuc/Claude-HA-Agent/claude-ha-agent

# Install dependencies if needed
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Then visit: **http://localhost:8000/**

The screensaver will load immediately!

### Option 2: Docker Build

```bash
# Build the Docker image
docker build -t voyeur-screensaver .

# Run the container
docker run -p 8000:5000 voyeur-screensaver
```

Then visit: **http://localhost:8000/**

### Option 3: Docker Compose (if available)

```bash
docker-compose up --build
```

## Adding Audio (Optional but Recommended)

The screensaver works without audio, but it's much better with sound!

1. **Get audio files** (see `/static/audio/README.md` for detailed instructions)
   - Download from Freesound.org, Zapsplat.com, or generate with AI
   - You need 5 files: ambient-city.mp3, police-siren.mp3, helicopter.mp3, thunder.mp3, ufo-whoosh.mp3

2. **Replace placeholder files:**
   ```bash
   # Copy your audio files to:
   /static/audio/ambient-city.mp3
   /static/audio/police-siren.mp3
   /static/audio/helicopter.mp3
   /static/audio/thunder.mp3
   /static/audio/ufo-whoosh.mp3
   ```

3. **Restart the server** - audio will load automatically

## Testing the Screensaver

### Visual Tests:
- ✅ Canvas fills entire viewport
- ✅ Sky gradient renders smoothly
- ✅ Stars visible and some twinkle
- ✅ Cityscape silhouette at bottom
- ✅ Main building centered with 24 windows (4×6 grid)
- ✅ Windows show different animations
- ✅ At least 15 windows lit at any time
- ✅ Special effects appear periodically (wait 30-60 seconds)

### Interaction Tests:
- ✅ Press 'M' to toggle mute
- ✅ Resize browser window - layout adjusts
- ✅ Works on mobile (touch to start audio if needed)

### Performance:
- Should maintain 50-60 fps on modern hardware
- Check browser dev tools → Performance monitor

## The 24 Window Vignettes

1. **Aerobics Person** - Jumping jacks and stretches
2. **TV Watcher** - Head bobbing while watching
3. **Chef** - Flipping food (sometimes drops it!)
4. **Plant Enthusiast** - Watering plants obsessively
5. **Artist** - Painting (canvas changes colors)
6. **Reader** - Reading in armchair, page turns
7. **Cat & Laser** - Cat chasing red laser dot
8. **Dog Waiting** - Tail wagging, waiting for owner
9. **Fish Tank** - Multiple fish swimming with bubbles
10. **Bird in Cage** - Hopping between perches
11. **Dancing Couple** - Romantic slow dance with spins
12. **Arguing Couple** - Dramatic gestures and pointing
13. **Party Scene** - Multiple people dancing with balloons
14. **Phone Pacer** - Pacing back and forth on call
15. **Sleeping Person** - Breathing with Z's floating up
16. **Yoga/Meditation** - Lotus position with stretches
17. **Bathtub** - Bubbles rising, arm occasionally visible
18. **Intense Gamer** - Leaning and rocking with controller
19. **Late Night Worker** - Typing on computer, screen glow
20. **Magician** - Making rabbit appear/disappear from hat
21. **Juggler** - Juggling 3 balls (sometimes drops one)
22. **Telescope Watcher** - Observes sky, reacts to UFO!
23. **Shadow Puppets** - Hand shapes projected on wall
24. **Disco Ball** - Spinning with colored light spots

## The 7 Special Effects

1. **UFO** (every 45-90 sec) - Flying saucer with green beam, triggers telescope watcher
2. **Police Car** (every 60-120 sec) - Red/blue flashing lights at street level
3. **Shooting Star** (every 90-180 sec) - Quick streak across night sky
4. **Helicopter Spotlight** (every 120-240 sec, rare) - Bright spotlight sweeping building
5. **Lightning & Thunder** (every 90-180 sec) - Sky flashes white, thunder follows
6. **Airplane** (every 60-120 sec) - Plane with blinking wing lights
7. **Window Lights** (continuous) - Windows randomly turn on/off

## Troubleshooting

### Screensaver doesn't load:
- Check that FastAPI server is running
- Verify static directory exists and has files
- Check browser console for errors (F12)
- Ensure port 8000 (or 5000) is accessible

### No animations visible:
- Check if JavaScript is enabled
- Look for errors in browser console
- Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Audio doesn't play:
- Click anywhere on page (browser autoplay policy)
- Check if audio files exist (not just empty placeholders)
- Press 'M' to unmute if accidentally muted
- Check browser console for audio loading errors

### Poor performance / low FPS:
- Close other browser tabs
- Check if GPU acceleration is enabled
- Try on a different device/browser
- Reduce browser window size (fewer pixels to render)

### Static files not found (404 errors):
- Verify Dockerfile copies static directory
- Check that static mount in main.py is AFTER route includes
- Ensure working directory matches static file location

## Customization

### Adjust Colors:
Edit `voyeur.js` → `COLORS` object at the top

### Change Effect Timing:
Edit `voyeur.js` → `TIMING` object (values in milliseconds)

### Modify Window Count:
Edit `voyeur.js` → `calculateLayout()` function → `cols` and `rows` variables

### Add More Vignettes:
1. Create new class extending pattern of existing vignettes
2. Add to `vignetteClasses` array in `calculateLayout()`
3. Adjust `cols × rows` to match total count

## API Endpoints

The screensaver doesn't interfere with existing API endpoints:

- `GET /` - Screensaver (index.html)
- `GET /health` - Health check (still works)
- `GET /api/*` - All API routes (still work)
- `GET /voyeur.js` - Animation script
- `GET /audio/*.mp3` - Audio files

## Architecture Notes

### How Static Files Work:
- FastAPI's `StaticFiles` middleware mounted at root (`/`)
- Mounted AFTER all other routes so `/api` and `/health` have priority
- `html=True` parameter serves `index.html` at root URL automatically
- All files in `/static/` are publicly accessible

### How Animation Works:
- Single `<canvas>` element fills viewport
- JavaScript animation loop using `requestAnimationFrame()`
- All 24 windows render independently with their own animation state
- Special effects layered on top using same canvas context
- Event scheduler triggers effects at randomized intervals
- Audio system loads files asynchronously, plays on events

### Performance Considerations:
- DeltaTime-based animation (frame-rate independent)
- Efficient rendering (skip non-visible elements)
- Debounced resize handler (prevents excessive recalculations)
- Pre-calculated layouts stored to avoid repeated computation

## Browser Support

**Fully Supported:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

**Required Features:**
- HTML5 Canvas
- ES6 JavaScript
- requestAnimationFrame
- Web Audio API (optional, degrades gracefully)

## File Size

- **index.html:** ~1 KB
- **voyeur.js:** ~85 KB (uncompressed)
- **Audio files:** ~1-2 MB total (when added)
- **Total:** ~2-3 MB complete experience

## Next Steps

1. **Test it!** - Visit http://localhost:8000/ and enjoy
2. **Add audio** - Follow `/static/audio/README.md` to get sound files
3. **Share it** - Deploy to production and share the quirky experience
4. **Customize** - Tweak colors, timing, or add your own vignettes

## Credits

Recreation of the classic "After Dark - Totally Twisted - Voyeur" screensaver by Berkeley Systems (1995). This is a modern web-based tribute with enhanced graphics and animations.

Built with:
- HTML5 Canvas
- Vanilla JavaScript (ES6)
- Web Audio API
- FastAPI (Python)

---

**Enjoy the nostalgic, quirky world of the Voyeur screensaver!** 🏙️✨
