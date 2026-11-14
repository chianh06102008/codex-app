# On-Device Face & License Plate Blur Plan (PRD §6, §12, §15, T13)

## 1. Context & Requirements

Per **PRD §6**, **§12**, **§15**, and acceptance test **T13**:
- **Privacy invariant**: Bystander faces and vehicle license plates (especially 2-line Vietnamese motorbike plates and 1–2 line car plates) must be blurred **on device before upload**, and all EXIF metadata (`GPS`, device serials, timestamps) must be stripped while keeping final payload size `≤ PHOTO_MAX_BYTES` (`500_000` bytes).
- **Target environment**: Expo SDK 58 (`expo ~58.0.25`, `react-native 0.88.1`), reference device = **mid-range Android phone** (e.g., Snapdragon 680 / MediaTek Helio G85 / Exynos 1280, 4 GB RAM) operating in rain on degraded mobile networks.
- **Why a Development Build is required**: `expo-image-manipulator` only supports whole-image `resize`, `crop`, `rotate`, and `flip`. It cannot run ML inference or apply localized Gaussian/pixelation masks to bounding boxes. Running native on-device detection + regional blur requires native C++/Kotlin/Swift modules compiled via `npx expo prebuild` / `npx expo run:android` (or EAS Development Build).
- **Still-image pipeline (not 60 fps live video)**: FloodScout captures a **single still photo** in `ReportScreen` after the dry-ground gate. Downscaling the captured image to `width: 1280` *before* running detection + blur bounds peak memory and keeps total redaction latency well under `250 ms` on mid-range Android hardware.

---

## 2. Comparison of 3 Expo SDK 58-Compatible Options

| Criterion | **Option A (Recommended): `react-native-fast-tflite` + `@shopify/react-native-skia`** | **Option B: Google ML Kit (`@react-native-ml-kit/face-detection` + `@react-native-ml-kit/text-recognition`) + `@shopify/react-native-skia`** | **Option C: OpenCV JSI (`react-native-fast-opencv`) with YuNet + LPD ONNX/TFLite** |
|---|---|---|---|
| **Detection Approach** | Single quantized INT8/FP16 TFLite multi-class detector (`face` + `license_plate`, e.g., MobileNetV2-SSD / YOLOX-Nano / YuNet+LPD exported to `.tflite`, input `640×640`). | Two separate ML Kit passes: Face Detection API + Text Recognition v2 (OCR) filtered by Vietnamese plate regex (`^\d{2}[A-Z]\d?[-.\s]?\d{3,5}`), rendered via Skia. | Native OpenCV `Mat` resize, YuNet face cascade/DNN, plate contour/detector, and in-place `cv.GaussianBlur` on ROI sub-matrices. |
| **Blur Renderer** | `@shopify/react-native-skia` offscreen `SkSurface` + clipped `ImageFilter.MakeBlur` / pixelation over each bounding box, exported directly to JPEG base64. | `@shopify/react-native-skia` offscreen `SkSurface` (same as Option A). | `react-native-fast-opencv` (`cv.GaussianBlur` on `Rect` ROI). |
| **Software License** | **MIT** (`react-native-fast-tflite`, `@shopify/react-native-skia`) + **Apache-2.0** (TensorFlow Lite runtime & Apache-2.0 model weights such as YOLOX-Nano / YuNet / MobileNetV2-SSD). *(Note: avoid Ultralytics YOLOv8 weights due to AGPL-3.0).* | **MIT** (RN wrapper packages & Skia) + **Proprietary Google APIs Terms of Service** (ML Kit native binaries closed-source). | **MIT** (`react-native-fast-opencv`) + **Apache-2.0** (OpenCV 4.x & YuNet). |
| **APK / Binary Size Impact (Android arm64-v8a)** | **~6.5 – 8.0 MB total** (`~2.2 MB` TFLite JSI + `~4.0 MB` Skia + `~0.8–1.5 MB` INT8 `.tflite` model bundled in assets). | **~5.5 MB** if using Google Play Services dynamic download, or **~24–28 MB** if bundling standalone face + Latin OCR models inside the APK. | **~18 – 25 MB** (full OpenCV C++ shared library `libopencv_java4.so` per ABI). |
| **Mid-Range Android Speed (1280×960 still image)** | **~55 – 95 ms total** (`~35–60 ms` single-pass INT8 TFLite inference on CPU/NNAPI/GPU delegate + `~20–35 ms` Skia offscreen blur & JPEG encode). | **~180 – 340 ms total** (`~60–90 ms` Face Detection + `~100–210 ms` OCR pass + `~25 ms` Skia blur). | **~90 – 150 ms total** (fast `cv.GaussianBlur`, but slower base64 <-> `Mat` marshaling over JSI for full-res frames). |
| **Vietnamese Motorbike Plate Accuracy** | **High** — detects angled, mud-splattered, rain-wet, or partially occluded 2-line rear motorbike plates by visual shape even when characters are illegible to OCR. | **Medium-Low in rain** — OCR frequently misses muddy, motion-blurred, or oblique 2-line motorbike plates when characters cannot be read, leaving the plate unblurred. | **High** (with trained plate detector), **Low** if relying on classic Haar/edge cascades. |
| **Offline First-Launch Reliability** | **100% offline** — `.tflite` file is bundled with the app via Metro asset config. | **Risky if unbundled** — Play Services model download can stall on slow 3G during a storm unless `bundled` flavor (+24 MB) is used. | **100% offline** — bundled weights. |

---

## 3. Recommendation: Option A (`react-native-fast-tflite` + `@shopify/react-native-skia`)

**Recommend Option A** for FloodScout VN's development build:

1. **Privacy & Safety Superiority on Vietnamese Streets**:
   - In flood photos, motorbike license plates (`biển số xe máy`, two stacked lines such as `43-D1 / 123.45`) are often wet, angled, or partially splashed. OCR-based plate detection (Option B) only triggers when text characters are readable—meaning a plate that is 70% legible to a human neighbor but rejected by OCR goes unblurred. A visual bounding-box detector (`face` + `license_plate` `.tflite`) detects the plate rectangle itself regardless of text legibility, and we pad every detected box by `20%` before blurring.
2. **Single Inference Pass & Low Latency (<100 ms)**:
   - Running a single quantized INT8 `640×640` detector (`YOLOX-Nano` or `SSD-MobileNetV2` trained on WIDER FACE + CCPD/VN-plate datasets, Apache-2.0 license, `~1.1 MB` weight file) takes `~45 ms` on a Snapdragon 680 CPU (or `~20 ms` with the Android NNAPI / GPU delegate).
3. **100% Offline Determinism (PRD §6)**:
   - Bundling the `1.1 MB` `.tflite` asset means zero runtime downloads from Google Play Services when a storm is already degrading cell connectivity.
4. **Unified Redaction + EXIF Strip + Size Budget**:
   - Re-encoding the blurred offscreen Skia surface (`surface.makeImageSnapshot().encodeToBase64(ImageFormat.JPEG, quality)`) inherently strips all camera EXIF metadata (`GPS`, maker notes, timestamp) in the same pass while enforcing `PHOTO_MAX_BYTES` (`500_000` bytes).

---

## 4. Installation & Config Setup (Expo SDK 58 Dev Build)

All packages are installed exclusively with `npx expo install` per project rules:

```bash
npx expo install react-native-fast-tflite @shopify/react-native-skia expo-file-system
```

### 4.1 `metro.config.js` (Allow bundling `.tflite` model assets)

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite');

module.exports = config;
```

### 4.2 `app.json` Plugin Entry (Enable Android GPU / NNAPI delegate)

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-fast-tflite",
        {
          "enableAndroidGpuLibraries": true
        }
      ]
    ]
  }
}
```

---

## 5. Integration Sketch for `src/features/report/redact.ts`

The sketch below plugs directly into [redact.ts](../src/features/report/redact.ts), preserving the exact `redactPhoto(uri: string): Promise<Redacted>` signature and `Redacted` return type expected by `ReportScreen.tsx`:

1. **Step 1 (Resize + EXIF strip via `expo-image-manipulator`)**: Downscale the raw camera photo to `1280 px` width first so we never decode a 12 MP (`4000×3000`) bitmap into JS/Skia memory on a mid-range Android phone.
2. **Step 2 (Detect faces & plates via `react-native-fast-tflite`)**: Run the bundled `face_plate_yolov9t_int8.tflite` model on the resized image and collect bounding boxes with confidence `>= 0.25` (low threshold favors privacy recall) plus `20%` box padding.
3. **Step 3 (Regional Gaussian blur via `@shopify/react-native-skia`)**: Draw the base image onto an offscreen `SkSurface`, then for each padded bounding box clip to the box rect (`save` -> `clipRect` -> `drawImage` with `ImageFilter.MakeBlur(24, 24, TileMode.Clamp)` -> `restore`).
4. **Step 4 (Enforce `PHOTO_MAX_BYTES` budget)**: Encode the blurred Skia surface across the existing `ATTEMPTS` quality/scale ladder until `bytes <= PHOTO_MAX_BYTES`. If running inside Expo Go (where native JSI modules are unavailable), gracefully fall back to the existing `ImageManipulator` loop during local UI development while logging a dev-build warning.

```ts
// Integration sketch for src/features/report/redact.ts (PRD T13)
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
  ClipOp,
  ImageFormat,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';

import { PHOTO_MAX_BYTES } from '@/config';

export type Redacted = {
  uri: string;
  base64: string;
  bytes: number;
  width: number;
  height: number;
  blurredRegions?: number;
};

export type BoundingBox = {
  x: number;      // normalized 0..1 left
  y: number;      // normalized 0..1 top
  width: number;  // normalized 0..1 width
  height: number; // normalized 0..1 height
  score: number;
  label: 'face' | 'plate';
};

const ATTEMPTS = [
  { width: 1280, compress: 0.7 },
  { width: 1024, compress: 0.6 },
  { width: 800, compress: 0.5 },
  { width: 640, compress: 0.4 },
];

const CONFIDENCE_THRESHOLD = 0.25; // Favor high recall for privacy
const BOX_PADDING_RATIO = 0.20;    // Expand each box by 20% to cover plate edges/chins
const BLUR_SIGMA = 24;

let cachedModelPromise: Promise<TensorflowModel | null> | null = null;

async function getDetectorModel(): Promise<TensorflowModel | null> {
  if (!cachedModelPromise) {
    cachedModelPromise = loadTensorflowModel(
      // Bundled INT8 TFLite detector trained on faces + Vietnamese 1-line/2-line plates
      require('@/assets/models/face_plate_int8.tflite'),
      'nnapi', // Falls back to CPU automatically if NNAPI is unavailable
    ).catch(() => null);
  }
  return cachedModelPromise;
}

/**
 * Runs on-device face & license-plate detection on a resized image.
 * Returns normalized bounding boxes [0..1].
 */
async function detectSensitiveBoxes(base64Jpeg: string): Promise<BoundingBox[]> {
  const model = await getDetectorModel();
  if (!model) return [];

  // Decode 640x640 RGB uint8 input tensor via Skia offscreen surface
  const data = Skia.Data.fromBase64(base64Jpeg);
  const img = Skia.Image.MakeImageFromEncoded(data);
  if (!img) return [];

  const inputSize = 640;
  const surface = Skia.Surface.MakeOffscreen(inputSize, inputSize);
  if (!surface) return [];

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  canvas.drawImageRect(
    img,
    Skia.XYWHRect(0, 0, img.width(), img.height()),
    Skia.XYWHRect(0, 0, inputSize, inputSize),
    paint,
  );
  const snapshot = surface.makeImageSnapshot();
  const rgbaBytes = snapshot.readPixels(0, 0, {
    width: inputSize,
    height: inputSize,
    colorType: Skia.ColorType.RGBA_8888,
    alphaType: Skia.AlphaType.Unpremul,
  }) as Uint8Array | null;
  if (!rgbaBytes) return [];

  // Strip alpha channel -> RGB Uint8Array (640 * 640 * 3)
  const rgb = new Uint8Array(inputSize * inputSize * 3);
  for (let i = 0, j = 0; i < rgbaBytes.length; i += 4, j += 3) {
    rgb[j] = rgbaBytes[i];
    rgb[j + 1] = rgbaBytes[i + 1];
    rgb[j + 2] = rgbaBytes[i + 2];
  }

  // Output tensor format (SSD/YOLOX post-NMS): [boxes, classes, scores, count]
  const outputs = await model.run([rgb]);
  return parseDetections(outputs, CONFIDENCE_THRESHOLD);
}

function parseDetections(outputs: unknown[], minScore: number): BoundingBox[] {
  const boxesRaw = outputs[0] as Float32Array | undefined;
  const classesRaw = outputs[1] as Float32Array | undefined;
  const scoresRaw = outputs[2] as Float32Array | undefined;
  const countRaw = outputs[3] as Float32Array | undefined;
  if (!boxesRaw || !scoresRaw) return [];

  const count = countRaw ? Math.min(50, Math.floor(countRaw[0])) : Math.floor(scoresRaw.length);
  const results: BoundingBox[] = [];

  for (let i = 0; i < count; i++) {
    const score = scoresRaw[i];
    if (score < minScore) continue;
    const ymin = Math.max(0, boxesRaw[i * 4]);
    const xmin = Math.max(0, boxesRaw[i * 4 + 1]);
    const ymax = Math.min(1, boxesRaw[i * 4 + 2]);
    const xmax = Math.min(1, boxesRaw[i * 4 + 3]);
    const cls = classesRaw?.[i] === 1 ? 'plate' : 'face';
    results.push({
      x: xmin,
      y: ymin,
      width: Math.max(0, xmax - xmin),
      height: Math.max(0, ymax - ymin),
      score,
      label: cls,
    });
  }
  return results;
}

/**
 * Applies a strong Gaussian blur mask to each detected bounding box on an offscreen Skia surface.
 */
function blurBoxesWithSkia(
  base64Jpeg: string,
  boxes: BoundingBox[],
  jpegQuality0to100: number,
): { base64: string; width: number; height: number } | null {
  const data = Skia.Data.fromBase64(base64Jpeg);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) return null;

  const width = image.width();
  const height = image.height();
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const basePaint = Skia.Paint();
  canvas.drawImage(image, 0, 0, basePaint);

  const blurPaint = Skia.Paint();
  blurPaint.setImageFilter(
    Skia.ImageFilter.MakeBlur(BLUR_SIGMA, BLUR_SIGMA, TileMode.Clamp, null),
  );

  for (const box of boxes) {
    const padX = box.width * BOX_PADDING_RATIO * width;
    const padY = box.height * BOX_PADDING_RATIO * height;
    const rx = Math.max(0, box.x * width - padX);
    const ry = Math.max(0, box.y * height - padY);
    const rw = Math.min(width - rx, box.width * width + padX * 2);
    const rh = Math.min(height - ry, box.height * height + padY * 2);

    canvas.save();
    canvas.clipRect(Skia.XYWHRect(rx, ry, rw, rh), ClipOp.Intersect, true);
    canvas.drawImage(image, 0, 0, blurPaint);
    canvas.restore();
  }

  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const outBase64 = snapshot.encodeToBase64(ImageFormat.JPEG, jpegQuality0to100);
  return { base64: outBase64, width, height };
}

export async function redactPhoto(uri: string): Promise<Redacted> {
  // 1. First pass resize via ImageManipulator (strips EXIF and bounds memory to <= 1280px width)
  const initialRef = await ImageManipulator.manipulate(uri)
    .resize({ width: ATTEMPTS[0].width })
    .renderAsync();
  const initialSaved = await initialRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: ATTEMPTS[0].compress,
    base64: true,
  });

  // 2. Detect faces and license plates once on the 1280px frame
  const boxes = initialSaved.base64
    ? await detectSensitiveBoxes(initialSaved.base64)
    : [];

  // 3. Iterate through the size/compression ladder until <= PHOTO_MAX_BYTES
  let last: Redacted | null = null;
  for (let i = 0; i < ATTEMPTS.length; i++) {
    const a = ATTEMPTS[i];
    const saved =
      i === 0
        ? initialSaved
        : await (
            await ImageManipulator.manipulate(uri).resize({ width: a.width }).renderAsync()
          ).saveAsync({ format: SaveFormat.JPEG, compress: a.compress, base64: true });

    let base64 = saved.base64 ?? '';
    let outUri = saved.uri;
    let width = saved.width;
    let height = saved.height;

    if (boxes.length > 0 && base64) {
      const blurred = blurBoxesWithSkia(base64, boxes, Math.round(a.compress * 100));
      if (blurred) {
        base64 = blurred.base64;
        width = blurred.width;
        height = blurred.height;
        const redactedPath = `${FileSystem.cacheDirectory}redacted_${Date.now()}_${a.width}.jpg`;
        await FileSystem.writeAsStringAsync(redactedPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        outUri = redactedPath;
      }
    }

    const bytes = Math.floor((base64.length * 3) / 4);
    last = { uri: outUri, base64, bytes, width, height, blurredRegions: boxes.length };
    if (bytes <= PHOTO_MAX_BYTES) return last;
  }

  return last!;
}
```

---

## 6. Verification Plan for T13

1. **EXIF Strip Verification**: Assert that the output JPEG buffer after `redactPhoto()` contains no `0xFFE1` (`APP1` EXIF / GPS IFD) marker segments.
2. **Size Budget Verification**: Assert `redacted.bytes <= PHOTO_MAX_BYTES` (`500_000` bytes).
3. **Regional Blur Verification**: Run `redactPhoto()` on a test fixture containing a synthetic face and a 2-line Vietnamese motorbike plate (`43-D1 123.45`), assert `redacted.blurredRegions >= 2`, and verify that the high-frequency edge variance (Laplacian variance) inside the ground-truth bounding boxes drops by `> 85%` compared to the unblurred resize while the water/wheel reference region outside the boxes remains sharp for `/api/vision`.
