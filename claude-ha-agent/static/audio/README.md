# Audio Files for Voyeur Screensaver

## Required Audio Files

The screensaver requires 5 audio files to be placed in this directory. Currently, placeholder files exist but need to be replaced with actual audio.

### Files Needed:

1. **ambient-city.mp3** (2-3 minutes, looping)
   - Distant city ambience with traffic sounds
   - Very subtle background atmosphere
   - Should loop seamlessly

2. **police-siren.mp3** (2-3 seconds)
   - Brief police siren "woop woop" sound
   - Triggered when police lights effect plays

3. **helicopter.mp3** (5-8 seconds)
   - Helicopter rotor sound (looping)
   - Plays during helicopter spotlight effect

4. **thunder.mp3** (3-4 seconds)
   - Thunder rumble sound
   - Plays after lightning flash

5. **ufo-whoosh.mp3** (2-3 seconds)
   - Sci-fi UFO whoosh or hum sound
   - Plays when UFO flies across screen

## Audio Specifications:

- **Format:** MP3
- **Bitrate:** 128-192 kbps
- **Sample Rate:** 44.1kHz
- **Total Size:** Approximately 1-2 MB for all files

## Where to Get Audio:

### Option 1: Free Sound Libraries (Recommended)

**Freesound.org** (CC0/CC-BY licensed)
- Search terms: "city ambience", "traffic distant", "police siren", "helicopter", "thunder", "whoosh sci-fi"
- Download and convert to MP3 if needed
- Ensure proper attribution for CC-BY licensed sounds

**Zapsplat.com** (free with attribution)
- Professional quality sound effects
- Good selection of city sounds and vehicle effects

**OpenGameArt.org** (game sound effects, often CC0)
- Good for quirky sound effects (UFO, sci-fi sounds)

### Option 2: Use These Quick Search Links

- **Ambient City:** Search "city ambience night" on Freesound
- **Police Siren:** Search "police siren short" on Freesound
- **Helicopter:** Search "helicopter distant" on Freesound
- **Thunder:** Search "thunder rumble" on Freesound
- **UFO:** Search "whoosh sci-fi" or "ufo sound" on Freesound

### Option 3: AI Generation

- **ElevenLabs** (sound effects generation)
- **AudioCraft** (Meta's open-source audio generation)

### Option 4: Simple Alternatives

If you want to test the visual aspects without audio:
- The screensaver will work without audio (gracefully degrades)
- Press 'M' to mute if placeholder audio causes issues
- Audio manager handles missing files without crashing

## Installation:

1. Download or generate the 5 audio files
2. Ensure they are in MP3 format
3. Name them exactly as listed above
4. Replace the placeholder files in this directory
5. Restart the FastAPI server
6. Test the screensaver - audio should play automatically

## Testing:

- Visit the screensaver URL
- Audio should start playing automatically (or on first click due to browser autoplay policies)
- Press 'M' to toggle mute
- Each special effect should trigger its corresponding sound

## Notes:

- The screensaver will work with or without audio
- Missing audio files will log warnings but won't crash the app
- Browser autoplay policies may require user interaction before audio starts
- Audio files are loaded asynchronously for better performance
