export interface PasswordChangeData {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  details?: {
    timestamp?: string;
    member_number?: string;
    execution_log?: any[];
  };
}