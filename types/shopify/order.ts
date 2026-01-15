
export interface Customer {
  first_name: string;
  last_name: string;
  email: string;
}

export interface LineItem {
  name: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: number;
  name: string;
  currency: string;
  customer: Customer;
  total_price: string;
  created_at: string;
  financial_status: string;
  line_items: LineItem[];
}