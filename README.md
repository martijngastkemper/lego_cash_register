# LEGO Part Scanner CLI

A **macOS-only** command-line tool to scan LEGO parts using your webcam and add them to your [Rebrickable](https://rebrickable.com/) part lists. Powered by the [Brickognize API](https://brickognize.com/) for image recognition.

---

## Features

- **Continuous Scanning**: Keep your camera open and scan parts one after another.
- **Automatic Part Detection**: Uses Brickognize to identify LEGO parts from images.
- **Rebrickable Integration**: Automatically adds scanned parts to your Rebrickable part lists.
- **Color Mapping**: Caches Rebrickable's color list locally for offline use.
- **Interactive Prompts**: If a part or color isn't recognized, you'll be prompted to enter the correct ID.
- **Repeat Last Part**: Press **`r`** to add the same part again without rescanning.

---

## Requirements

- **macOS** (required for `imagesnap` camera support)
- **Node.js 18+**
- **[Homebrew](https://brew.sh/)** (to install `imagesnap`)
- **API Keys**:
  - [Rebrickable API Key](https://rebrickable.com/api/)

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

### 3. Configure Environment Variables
Set the following environment variables:
```bash
export REBRICKABLE_API_KEY="your_rebrickable_api_key"
export REBRICKABLE_USER="your_rebrickable_username"
export REBRICKABLE_PASSWORD="your_rebrickable_password"
```
To make them persistent, add them to your shell config (e.g., `~/.zshrc` or `~/.bashrc`).

**Note**: You can also pass these values as CLI options instead of environment variables.

---

## Usage

### Build the Project
Before running the tool, build it:
```bash
pnpm run build
```

### Link for Global Use (Optional)
To use the `lego-scan` command from anywhere, you have several options:

**Option 1: Create a shell alias** (recommended):
```bash
# Add to your ~/.zshrc or ~/.bashrc
echo 'alias lego-scan="node $(pwd)/dist/cli.js"' >> ~/.zshrc
source ~/.zshrc
```

**Option 2: Use pnpm link** (pnpm v8+):
```bash
pnpm link
```
Then use the full path or configure your shell to find the linked binary.

**Option 3: Use pnpm exec**:
```bash
pnpm exec node dist/cli.js scan --your-options
```

### Start Continuous Scanning
Run the tool using `node`:
```bash
node dist/cli.js scan --rebrickable-key YOUR_REBRICKABLE_API_KEY --rebrickable-user YOUR_REBRICKABLE_USERNAME --rebrickable-password YOUR_REBRICKABLE_PASSWORD
```
Or if you've set up an alias (see above):
```bash
lego-scan scan --rebrickable-key YOUR_REBRICKABLE_API_KEY --rebrickable-user YOUR_REBRICKABLE_USERNAME --rebrickable-password YOUR_REBRICKABLE_PASSWORD
```
  - The camera will open, and you can press **Enter** to capture an image.
  - The tool will detect the part and add it directly to your selected Rebrickable part list.
  - Press **`r`** to repeat the last scanned part (no Enter needed).
  - Press **`<n>r`** to repeat multiple times, e.g. `3r` adds 3 of the last part (no Enter needed).
  - Press **`q`** to stop scanning (no Enter needed).

### Refresh Color Cache
```bash
node dist/cli.js refresh-colors --rebrickable-key YOUR_REBRICKABLE_API_KEY
```
Or if you've set up an alias (see above):
```bash
lego-scan refresh-colors --rebrickable-key YOUR_REBRICKABLE_API_KEY
```
- Updates the local cache of Rebrickable colors.
- Run this if you encounter missing color errors.

---

## Workflow

### Recommended Workflow for Quality Control
1. **Create a Temporary Part List**:
   - In Rebrickable, create a new part list (e.g., "Scanned Parts - 2024-09-24").
   - Use this list for scanning.

2. **Scan Parts**:
   ```bash
   lego-scan scan --rebrickable-user myuser --rebrickable-password mypass
   ```
   - Select your temporary part list when prompted.
   - Scan all your parts.

3. **Review and Move Parts**:
   - After scanning, go to Rebrickable and open your temporary part list.
   - Use Rebrickable's **Bulk Edit** tool to review the scanned parts.
   - Correct any mistakes (e.g., wrong part or color IDs from Brickognize).
   - Move the parts to your final part list or inventory.

4. **Delete Temporary List**:
   - Once verified, delete the temporary part list.

### Why This Workflow?
- **Catch Scanning Errors**: Brickognize may occasionally misidentify parts or colors. Reviewing in Rebrickable lets you catch and fix these mistakes.
- **Batch Processing**: The Bulk Edit tool makes it easy to correct multiple parts at once.
- **Flexibility**: You can scan parts over multiple sessions and review them all together.

---

## Examples

### Example Session
```bash
$ lego-scan scan --rebrickable-user myuser --rebrickable-password mypass
Press Enter to scan a part (or "r" to repeat, "<n>r" for multiple, "q" to quit): 
[press Enter]
📸 Capturing image... Done.
✅ Added to Rebrickable: Brick 2 x 4 (Part: 3001, Color: Red)

[press Enter]
📸 Capturing image... Done.
✅ Added to Rebrickable: Tile 2 x 2 (Part: 3068, Color: Blue)

[press r]
🔁 Added to Rebrickable again

[press 3 then r]
🔁 Added to Rebrickable again (x3)

[press q]
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
