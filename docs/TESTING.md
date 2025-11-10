# Clipp Testing Guide

## Manual Testing

### Checkout Flow
- Purchase a license
- Payment fails during checkout

### License Assignment
- Assign license to machine
- Unassign license from machine
- Unassign and reassign to different machine

### Subscription Cancellation
- Cancel subscription with license still assigned to machine
- Cancel subscription with no machines assigned
- Verify app still works until period end after cancellation
- Verify app stops working after period end passes

### Edge Cases
- Cancel then reassign license before period ends

---

## Automated E2E Testing

### Overview

Clipp uses [Playwright](https://playwright.dev/) for end-to-end testing of clipboard operations. Tests run against the actual Electron app and use the real system clipboard for verification.

### Running Tests

```bash
npm run test:e2e
```

This will:
1. Build the frontend
2. Launch the Electron app in test mode
3. Run all tests
4. Save verification files to `test-results/`

### Test Architecture

#### Test Mode

Tests run with `TEST_MODE=true` which:
- Uses a separate data directory: `~/Library/Application Support/Clipp-Test/`
- Skips authentication and license checks
- Disables DevTools
- Loads test fixtures instead of real clipboard history

#### Test Structure

```javascript
describe('Clipboard Operations', () => {
  beforeAll(() => {
    // Setup runs ONCE before all tests
    // - Copy test fixtures to test directory
    // - Copy test assets (images, files) to storage
  });

  beforeEach(() => {
    // Runs before EACH test
    // - Save current clipboard
    // - Launch Electron app
  });

  afterEach(() => {
    // Runs after EACH test
    // - Close app
    // - Restore clipboard
  });

  test('should copy text', () => {
    // 1. Find and click clipboard item
    // 2. Save clipboard to verification file
    // 3. Verify clipboard content programmatically
  });
});
```

#### Why This Structure?

- **`beforeAll`**: Fixture setup is expensive, only do it once
- **`beforeEach`**: Each test needs a fresh app instance and saved clipboard
- **Tests share fixtures**: All tests can run against the same fixture items without conflicts
- **Independent tests**: Each test saves/restores clipboard, so they don't interfere

### Test Fixtures

#### Location

- Test data: `electron/tests/fixtures/clipboard-history.json`
- Test assets: `electron/tests/fixtures/test-assets/`

#### clipboard-history.json

Array of clipboard items with known IDs for testing:

```json
[
  {
    "id": "test-text-1",
    "type": "text",
    "content": "Hello from Playwright test!",
    "createdAt": 1699900000000,
    "isFavorite": false,
    "hash": "test-hash-1"
  },
  {
    "id": "test-image-1",
    "type": "image",
    "content": "/path/to/test-assets/sample-image.png",
    "metadata": {
      "files": [{
        "path": "/path/to/test-assets/sample-image.png",
        "name": "sample-image.png",
        "extension": ".png"
      }]
    },
    "createdAt": 1699900001000,
    "isFavorite": false,
    "hash": "test-hash-2"
  }
]
```

### Verification Files

Tests save clipboard content to `test-results/` for manual verification:

- `test-results/clipboard-text.txt` - Text clipboard content
- `test-results/clipboard-image.png` - Image clipboard content
- `test-results/clipboard-file-*.txt` - File paths copied to clipboard

After running tests, you can open these files to visually confirm the clipboard operations worked correctly.

### Writing New Tests

#### 1. Add Test Fixture

Add your test item to `clipboard-history.json` with a unique ID like `test-{type}-{n}`.

#### 2. Add Test Assets

If testing images/files, add them to `tests/fixtures/test-assets/`.

#### 3. Update beforeAll

If using file-based clipboard types (image, file, etc.), copy the asset to test storage in `beforeAll`:

```javascript
beforeAll(() => {
  // Copy image to test storage
  const srcImage = path.join(__dirname, '..', 'fixtures', 'test-assets', 'sample-image.png');
  const destDir = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-image-1');
  fs.ensureDirSync(destDir);
  fs.copySync(srcImage, path.join(destDir, 'sample-image.png'));
});
```

#### 4. Write Test

```javascript
test('should copy {type}', async () => {
  // Find and click item
  await window.click('[data-item-id="test-{type}-1"]');

  // Save clipboard to verification file
  await execAsync('pbpaste > test-results/clipboard-{type}.txt');

  // Verify clipboard content
  const { stdout: clipboardContent } = await execAsync('pbpaste');
  expect(clipboardContent).toBe('expected content');
});
```

### Clipboard Interaction

Tests use the **real system clipboard** via macOS `pbpaste`/`pbcopy` commands:

- **Save clipboard**: `pbpaste > file.txt`
- **Restore clipboard**: `cat file.txt | pbcopy`
- **Get clipboard**: `const content = await execAsync('pbpaste')`

For images/rich content:
- **Get PNG**: `pbpaste -Prefer png > image.png`
- **Get file paths**: `pbpaste` (returns newline-separated paths)

### Troubleshooting

#### Tests timeout

The app might not be closing properly. Check:
- Is `app.isQuiting` being set correctly?
- Is there a background process still running?

#### Fixtures not loading

Check:
- Is `TEST_MODE=true` being passed?
- Is the fixture file being copied to the test directory?
- Is `ClipboardHistoryStore` loading after `app.setPath()` is called?

#### Clipboard verification fails

- Your clipboard may have been modified during the test
- Try running tests again with no other apps using the clipboard
- Check the verification files in `test-results/` to see what was actually copied

### Future Improvements

- [ ] Add tests for multi-image clipboard items
- [ ] Add tests for file clipboard items
- [ ] Add tests for pin/unpin functionality
- [ ] Add tests for clipboard history persistence
- [ ] Mock Supabase for completely offline testing
- [ ] Add GitHub Actions CI configuration
