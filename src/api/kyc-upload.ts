import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

/**
 * Uploads a local file straight to a presigned S3/AIStor PUT URL.
 *
 * Deliberately NOT routed through the shared JSON API client: this request
 * goes to object storage, not to go-ride-backend. That client would attach an
 * auth bearer token S3 does not expect and force Content-Type: application/json,
 * which breaks the signature that go-ride-backend signed the presigned URL with.
 *
 * contentType MUST be byte-for-byte the same string that was sent as
 * `content_type` to POST /driver/kyc/documents/upload-url — S3 signs that
 * header into the URL, so any difference is a hard 403 from storage.
 */
export async function putDocumentBytes(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  // expo-file-system's File implements the web Blob interface, so expo/fetch
  // streams it instead of encoding several MB into an in-memory string.
  const file = new File(fileUri);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    // File implements Blob at runtime; expo/fetch's RequestInit types don't
    // model that, so we cast rather than converting to an in-memory string
    // (which would reintroduce the memory problem this helper avoids).
    body: file as unknown as BodyInit,
  });

  if (!response.ok) {
    // S3 error bodies are XML, not go-ride-backend's {code, message} shape —
    // never try to parse this as ApiErrorBody.
    throw new Error(`Document upload failed with status ${response.status}`);
  }
}
