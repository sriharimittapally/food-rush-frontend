// ════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════
export type Role =
  | 'CUSTOMER'
  | 'RESTAURANT_OWNER'
  | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
export interface LoginRequest {
  email:    string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email:    string;
  phone:    string;
  password: string;
  role:     Role;
}

export interface AuthResponse {
  token:    string;
  email:    string;
  fullName: string;
  role:     Role;
  message:  string;
}

// ════════════════════════════════════════
// USER
// ════════════════════════════════════════
export interface User {
  id:        number;
  fullName:  string;
  email:     string;
  phone:     string;
  role:      Role;
  active:    boolean;  // isActive → Jackson → "active"
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone:    string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

// ════════════════════════════════════════
// RESTAURANT
// ════════════════════════════════════════
export interface Restaurant {
  id:          number;
  name:        string;
  address:     string;
  city:        string;
  phone:       string;
  imageUrl:    string | null;
  cuisineType: string;
  rating:      number;
  open:        boolean;  // isOpen → Jackson → "open"
  createdAt:   string;
  ownerName?:  string;
  ownerEmail?: string;
}

export interface RestaurantRequest {
  name:        string;
  address:     string;
  city:        string;
  phone:       string;
  imageUrl:    string;
  cuisineType: string;
}

// ════════════════════════════════════════
// MENU ITEM
// ════════════════════════════════════════
export interface MenuItem {
  id:             number;
  name:           string;
  description:    string;
  price:          number;
  imageUrl:       string | null;
  category:       string;
  isVeg:            boolean;  // isVeg → Jackson → "veg"
  isAvailable:      boolean;  // isAvailable → Jackson → "available"
  restaurantId:   number;
  restaurantName: string;
}

export interface MenuItemRequest {
  name:        string;
  description: string;
  price:       number;
  imageUrl:    string;
  category:    string;
  veg:         boolean;
}

// ════════════════════════════════════════
// CART  (frontend only — never sent to backend)
// ════════════════════════════════════════
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// ════════════════════════════════════════
// ORDER
// ════════════════════════════════════════
export interface OrderItemRequest {
  menuItemId: number;
  quantity:   number;
}

export interface OrderRequest {
  restaurantId:        number;
  items:               OrderItemRequest[];
  deliveryAddress:     string;
  specialInstructions: string;
}

export interface OrderItemResponse {
  menuItemId:   number;
  menuItemName: string;
  category:     string;
  veg:          boolean;
  quantity:     number;
  price:        number;
  subtotal:     number;
}

export interface Order {
  id:                  number;
  status:              OrderStatus;
  totalAmount:         number;
  deliveryAddress:     string;
  specialInstructions: string;
  createdAt:           string;
  updatedAt:           string;
  customerId:          number;
  customerName:        string;
  customerEmail:       string;
  restaurantId:        number;
  restaurantName:      string;
  orderItems:          OrderItemResponse[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════
export interface AdminDashboard {
  totalCustomers:        number;
  totalRestaurantOwners: number;
  totalRestaurants:      number;
  openRestaurants:       number;
  totalOrders:           number;
  pendingOrders:         number;
  deliveredOrders:       number;
  cancelledOrders:       number;
}

export interface RestaurantRevenue {
  restaurantId:         number;
  name:                 string;
  city:                 string;
  ownerName:            string;
  totalRevenue:         number;
  totalDeliveredOrders: number;
}