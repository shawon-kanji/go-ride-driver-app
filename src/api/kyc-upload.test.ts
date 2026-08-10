jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({ uri })),
}));

import { fetch as expoFetch } from 'expo/fetch';

import { makeUploadResponse } from '../test-utils/expo-mocks';
import { putDocumentBytes } from './kyc-upload';

describe('putDocumentBytes', () => {
  beforeEach(() => {
    (expoFetch as jest.Mock).mockReset();
  });

  it('PUTs the file to the presigned url with the exact Content-Type it was given', async () => {
    (expoFetch as jest.Mock).mockResolvedValue(makeUploadResponse(true, 200));

    await putDocumentBytes('https://s3.example/put?sig=abc', 'file:///tmp/doc.jpg', 'image/jpeg');

    expect(expoFetch).toHaveBeenCalledTimes(1);
    const [url, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://s3.example/put?sig=abc');
    expect(init.method).toBe('PUT');
    expect(init.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(init.body).toEqual({ uri: 'file:///tmp/doc.jpg' });
  });

  it('does not send an Authorization header', async () => {
    (expoFetch as jest.Mock).mockResolvedValue(makeUploadResponse(true, 200));

    await putDocumentBytes('https://s3.example/put?sig=abc', 'file:///tmp/doc.jpg', 'image/png');

    const [, init] = (expoFetch as jest.Mock).mock.calls[0];
    expect(Object.keys(init.headers)).toEqual(['Content-Type']);
    expect(init.headers['Content-Type']).not.toBe('application/json');
  });

  it('throws when the response is not ok', async () => {
    (expoFetch as jest.Mock).mockResolvedValue(makeUploadResponse(false, 403));

    await expect(
      putDocumentBytes('https://s3.example/put?sig=abc', 'file:///tmp/doc.jpg', 'image/jpeg'),
    ).rejects.toThrow('403');
  });
});
