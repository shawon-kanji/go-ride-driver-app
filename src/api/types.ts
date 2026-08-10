// Hand-maintained mirrors of go-ride-backend's Go DTOs — no OpenAPI/codegen exists,
// see .planning/PROJECT.md. Keep in sync with application/driver/dto.go and
// application/vehicle/dto.go in go-ride-backend when the backend contract changes.

export type AccountStatus = 'pending' | 'active' | 'blocked';

export interface Driver {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_status: AccountStatus;
  is_email_verified: boolean;
  is_online: boolean;
}

export type DriverSummary = Pick<Driver, 'id' | 'email' | 'first_name' | 'last_name'>;

export type VehicleCategory = 'normal' | 'luxury';

export interface Vehicle {
  id: string;
  driver_id: string;
  plate_number: string;
  color: string;
  model_name: string;
  seat_count: number;
  category: VehicleCategory;
  is_active: boolean;
}

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  driver: Driver;
}

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
}

export interface VehiclePayload {
  plate_number: string;
  color: string;
  model_name: string;
  seat_count: number;
  category: VehicleCategory;
}

/** Flat {code, message} error body — go-ride-backend's pkg/apperror shape, no nested wrapper. */
export interface ApiErrorBody {
  code: string;
  message: string;
}

// KYC types mirror application/kyc/dto.go and domain/kyc/entity.go in go-ride-backend.

export type KycStatus = 'not_started' | 'in_review' | 'approved' | 'rejected';

export type DocumentStatus = 'uploaded' | 'approved' | 'rejected';

export type IdentityDocumentType =
  | 'selfie'
  | 'govt_id_front'
  | 'govt_id_back'
  | 'driving_license_front'
  | 'driving_license_back';

export type VehicleDocumentType =
  | 'vehicle_registration'
  | 'vehicle_photo_front'
  | 'vehicle_photo_back'
  | 'vehicle_photo_side'
  | 'vehicle_number_plate';

export type DocumentType = IdentityDocumentType | VehicleDocumentType;

export interface DocumentResponse {
  id: string;
  document_type: DocumentType;
  vehicle_id?: string;
  status: DocumentStatus;
  rejection_reason?: string;
}

export interface KycStatusResponse {
  kyc_status: KycStatus;
  documents: DocumentResponse[];
}

export interface RequestUploadUrlPayload {
  document_type: DocumentType;
  content_type: string;
  /** Present ONLY for vehicle-scoped document types — the key must be absent
   *  (not an empty string) for identity types; go-ride-backend's
   *  application/kyc/validation.go rejects a present-but-empty vehicle_id. */
  vehicle_id?: string;
}

export interface RequestUploadUrlResponse {
  upload_url: string;
  key: string;
}

export interface ConfirmUploadPayload {
  document_type: DocumentType;
  key: string;
  /** Same present/absent rule as RequestUploadUrlPayload.vehicle_id. */
  vehicle_id?: string;
}
