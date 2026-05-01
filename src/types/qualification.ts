export interface StaffQualification {
  service_id: string;
  service_name: string;
}

export interface QualifiedStaff {
  user_id: string;
  name: string;
  email: string;
}

export interface GrantQualificationInput {
  staffId: string;
  serviceId: string;
}

export interface RevokeQualificationInput {
  staffId: string;
  serviceId: string;
}
