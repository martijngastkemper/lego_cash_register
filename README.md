# LEGO Part Scanner CLI

A **macOS-only** command-line tool to scan LEGO parts using your webcam and add them to your [Rebrickable](https://rebrickable.com/) inventory. Powered by the [Brickognize API](https://brickognize.com/) for image recognition.

---

## Features

- **Continuous Scanning**: Keep your camera open and scan parts one after another.
- **Automatic Part Detection**: Uses Brickognize to identify LEGO parts from images.
- **Rebrickable Integration**: Automatically adds scanned parts to your Rebrickable inventory.
- **Color Mapping**: Caches Rebrickable's color list locally for offline use.
- **Interactive Prompts**: If a part or color isn't recognized, you'll be prompted to enter the correct ID.

---

## Requirements

- **macOS** (required for `imagesnap` camera support)
- **Node.js 18+**
- **[Homebrew](https://brew.sh/)** (to install `imagesnap`)
- **API Keys**:
  - [Rebrickable API Key](https://rebrickable.com/api/) (set as `REBRICKABLE_API_KEY`)

---

## Installation

### 1. Install `imagesnap`
```bash
brew install imagesnap
```

### 2. Clone and Set Up
```bash
git clone <repository-url>
cd lego_cash_register
pnpm install
```

### 3. Configure API Keys
Set your Rebrickable API key as an environment variable:
```bash
export REBRICKABLE_API_KEY="your_rebrickable_api_key"
```
To make it persistent, add it to your shell config (e.g., `~/.zshrc` or `~/.bashrc`).

---

## Usage

### Start Continuous Scanning
```bash
lego-scan scan --rebrickable-user YOUR_REBRICKABLE_USERNAME --rebrickable-password YOUR_REBRICKABLE_PASSWORD
```
- The camera will open, and you can press **Enter** to capture an image.
- The tool will detect the part and add it to a temporary list.
- Press **`q` + Enter** to stop scanning and upload all parts to Rebrickable.

### Dry Run (Scan Without Uploading)
```bash
lego-scan scan --dry-run
```
- Scans parts but does **not** add them to Rebrickable.
- Useful for testing or verifying part detection.

### Refresh Color Cache
```bash
lego-scan refresh-colors
```
- Updates the local cache of Rebrickable colors.
- Run this if you encounter missing color errors.

---

## Workflow

1. **Start Scanning**:
   ```bash
   lego-scan scan --rebrickable-user myuser --rebrickable-password mypass
   ```
2. **Capture Parts**:
   - Position a LEGO part in front of your camera.
   - Press **Enter** to capture an image.
   - The tool will detect the part and display its name, ID, and color.
   - Repeat for additional parts.

3. **Stop Scanning**:
   - Press **`q` + Enter** to stop.
   - All scanned parts will be uploaded to your Rebrickable inventory.

4. **Handle Errors**:
   - If a part or color isn't recognized, you'll be prompted to enter the correct ID.
   - If the camera fails, retry by pressing **Enter** again.

---

## Examples

### Example Session
```bash
$ lego-scan scan --rebrickable-user myuser --rebrickable-password mypass
Starting continuous scanning. Press "q" + Enter to stop.
Press Enter to scan a part (or "q" to quit): [press Enter]
* Camera captures image *
Detected: Brick 2 x 4 (Part: 3001, Color: Red)
Added to parts list: Brick 2 x 4 (ID: 3001, Color: 1)
Total parts scanned: 1

Press Enter to scan a part (or "q" to quit): [press Enter]
* Camera captures image *
Detected: Tile 2 x 2 (Part: 3068, Color: Blue)
Added to parts list: Tile 2 x 2 (ID: 3068, Color: 4)
Total parts scanned: 2

Press Enter to scan a part (or "q" to quit): q

Finalizing parts list...
Added to Rebrickable: Brick 2 x 4
Added to Rebrickable: Tile 2 x 2
Parts list finalized.
```

---

## Troubleshooting

### Camera Not Working
- Ensure `imagesnap` is installed:
  ```bash
  brew install imagesnap
  ```
- Check camera permissions in **System Settings > Privacy & Security > Camera**.

### API Key Errors
- Verify your Rebrickable API key is set correctly:
  ```bash
  echo $REBRICKABLE_API_KEY
  ```
- Ensure your Rebrickable API key is valid and has the correct permissions.

### Part or Color Not Found
- If a part or color isn't recognized, you'll be prompted to enter the correct ID.
- To refresh the color cache:
  ```bash
  lego-scan refresh-colors
  ```

---

## Project Structure

```
.
├── src/
│   ├── cli.ts                  # CLI entry point
│   ├── brickognize/
│   │   └── client.ts           # Brickognize API wrapper
│   ├── rebrickable/
│   │   ├── client.ts           # Rebrickable wrapper
│   │   └── colorCache.ts       # Color caching logic
│   ├── scanner/
│   │   ├── scan.ts             # Single scan logic
│   │   └── continuous.ts       # Continuous scanning loop
│   ├── camera/
│   │   └── capture.ts          # imagesnap wrapper
│   └── utils/
│       ├── config.ts           # API keys, env vars
│       ├── logger.ts           # Logging
│       └── prompt.ts           # User prompts
├── temp/                       # Temporary images (auto-cleaned)
└── README.md                   # This file
```

---

## License

MIT
