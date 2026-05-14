export type UserRole = "customer" | "ob" | "admin";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentMethod = "cash" | "transfer";
export type PaymentStatus = "unpaid" | "paid";

// Row types (plain interfaces to avoid circular Omit)
export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  unit_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  invoice_sent_at: string | null;
  invoice_pdf_url: string | null;
  customer_notes: string | null;
  ob_notes: string | null;
  midtrans_transaction_id: string | null;
  midtrans_payment_url: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface NotificationLog {
  id: string;
  order_id: string | null;
  channel: string;
  recipient: string;
  type: string;
  status: string;
  sent_at: string;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      service_categories: {
        Row: ServiceCategory;
        Insert: Omit<ServiceCategory, "id" | "created_at">;
        Update: Partial<Omit<ServiceCategory, "id" | "created_at">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Service, "id" | "created_at" | "updated_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Order, "id" | "created_at" | "updated_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at">;
        Update: Partial<Omit<OrderItem, "id" | "created_at">>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: Omit<OrderStatusHistory, "id" | "created_at">;
        Update: Partial<Omit<OrderStatusHistory, "id" | "created_at">>;
      };
      notification_log: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, "id" | "sent_at">;
        Update: Partial<Omit<NotificationLog, "id" | "sent_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}

// Composite types for joined queries
export type ServiceWithCategory = Service & {
  service_categories: ServiceCategory | null;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
  ob: Pick<Profile, "id" | "full_name" | "phone"> | null;
};
