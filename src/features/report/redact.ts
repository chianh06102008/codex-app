// On-device redaction before upload (PRD T13). Re-encoding through the image
// manipulator drops all EXIF (GPS, device, time); we also downsize until the file
// fits PHOTO_MAX_BYTES. Face/plate blur needs an ML model that Expo Go does not
// ship; it is tracked for a development build.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { PHOTO_MAX_BYTES } from '@/config';

export type Redacted = { uri: string; base64: string; bytes: number; width: number; height: number };

const ATTEMPTS = [
  { width: 1280, compress: 0.7 },
  { width: 1024, compress: 0.6 },
  { width: 800, compress: 0.5 },
  { width: 640, compress: 0.4 },
];

export async function redactPhoto(uri: string): Promise<Redacted> {
  let last: Redacted | null = null;
  for (const a of ATTEMPTS) {
    const ref = await ImageManipulator.manipulate(uri).resize({ width: a.width }).renderAsync();
    const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: a.compress, base64: true });
    const base64 = saved.base64 ?? '';
    const bytes = Math.floor((base64.length * 3) / 4);
    last = { uri: saved.uri, base64, bytes, width: saved.width, height: saved.height };
    if (bytes <= PHOTO_MAX_BYTES) return last;
  }
  return last!;
}
