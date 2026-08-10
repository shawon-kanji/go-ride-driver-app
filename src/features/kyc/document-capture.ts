import * as ImagePicker from 'expo-image-picker';

export type CaptureResult =
  | { status: 'captured'; uri: string; contentType: string }
  | { status: 'canceled' }
  | { status: 'permission-denied' };

/** ImagePickerAsset.mimeType is null on some Android gallery sources. The
 *  returned value is used for BOTH the /upload-url content_type and the PUT's
 *  Content-Type header — compute it exactly once, here, and never recompute
 *  it downstream, or the presigned signature will not match (research Pitfall 1). */
export function resolveContentType(mimeType: string | null | undefined): string {
  return mimeType ?? 'image/jpeg';
}

/** Primary action on every document tile — opens the OS camera directly. */
export async function captureFromCamera(): Promise<CaptureResult> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) return { status: 'permission-denied' };

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = result.canceled ? null : (result.assets[0] ?? null);
  if (!asset) return { status: 'canceled' };

  return { status: 'captured', uri: asset.uri, contentType: resolveContentType(asset.mimeType) };
}

/** Secondary affordance for retakes / already-scanned documents. */
export async function pickFromLibrary(): Promise<CaptureResult> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) return { status: 'permission-denied' };

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
  const asset = result.canceled ? null : (result.assets[0] ?? null);
  if (!asset) return { status: 'canceled' };

  return { status: 'captured', uri: asset.uri, contentType: resolveContentType(asset.mimeType) };
}
