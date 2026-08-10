/** Matches expo-image-picker's ImagePickerAsset fields this app actually reads. */
export function makeImagePickerAsset(overrides: Record<string, unknown> = {}) {
  return { uri: 'file:///tmp/test-document.jpg', mimeType: 'image/jpeg', width: 100, height: 100, ...overrides };
}

/** Minimal stand-in for an `expo/fetch` Response — only .ok/.status are read
 *  by src/api/kyc-upload.ts (S3 error bodies are XML and are never parsed). */
export function makeUploadResponse(ok = true, status = 200) {
  return { ok, status };
}
