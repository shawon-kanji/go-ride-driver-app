describe('useUploadDocumentMutation', () => {
  describe('identity documents', () => {
    it.todo('omits vehicle_id entirely from the upload-url and confirm payloads');
  });
  describe('upload sequence', () => {
    it.todo('calls upload-url, then the raw PUT, then confirm, in that order');
    it.todo('invalidates the kyc status query after a successful upload');
  });
  describe('vehicle-scoped documents', () => {
    it.todo('includes vehicle_id in the upload-url and confirm payloads');
    it.todo('throws before any network call when vehicle_id is missing');
  });
});
