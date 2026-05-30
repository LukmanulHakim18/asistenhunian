// ─── Domain enums ────────────────────────────────────────────────────────────

export type UserRole = "customer" | "ob" | "admin";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "qris";
export type PaymentStatus = "unpaid" | "paid";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  unit_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  unit_number?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithCategory extends Service {
  service_categories: ServiceCategory | null;
}

export interface ServiceRequest {
  category_id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  service_id: string | null;
  service_name: string;
  service_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  unit_number: string;
  requested_date: string;
  preferred_time_note: string | null;
  confirmed_datetime: string | null;
  ob_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  total: number;
  customer_notes: string | null;
  ob_notes: string | null;
  midtrans_transaction_id: string | null;
  midtrans_payment_url: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  ob?: { id: string; full_name: string; phone: string | null } | null;
}

export interface OrderItemRequest {
  service_id: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  unit_number: string;
  requested_date: string;
  preferred_time_note?: string;
  payment_method: PaymentMethod;
  customer_notes?: string;
  items: OrderItemRequest[];
}

export interface CreateOrderResponse {
  id: string;
  order_number: string;
  midtrans_payment_url?: string | null;
}

export interface UpdateStatusRequest {
  status: OrderStatus;
  ob_notes?: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  unit_number?: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface OBUser extends User {
  email: string;
}

export interface CreateOBRequest {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
}

export interface UpdateOBRequest {
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  password?: string;
}

export interface LaporanRow {
  month: string;
  total_orders: number;
  total_revenue: number;
  cash_revenue: number;
  transfer_revenue: number;
}
