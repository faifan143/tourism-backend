# Next.js Dashboard Integration Guide

## Overview
This guide provides a quick reference for integrating the Tourism Backend API with your Next.js RBAC dashboard.

## Authentication Flow

### 1. Login
```typescript
POST /auth/login
Body: { email: string, password: string }
Response: { accessToken: string, user: { id, email, role } }
```

**Store the token:**
```typescript
// In your auth context/store
localStorage.setItem('auth_token', response.accessToken);
localStorage.setItem('user_role', response.user.role);
```

### 2. Get Current User
```typescript
GET /auth/me
Headers: { Authorization: `Bearer ${token}` }
Response: { id, email, role, createdAt }
```

### 3. Register (Admin Only)
```typescript
POST /auth/register
Headers: { Authorization: `Bearer ${adminToken}` }
Body: { email: string, password: string, role?: "ADMIN" | "USER" }
```

---

## Dashboard Routes by Role

### Guest Dashboard (Public)
```typescript
GET /dashboard/guest
// No authentication required
// Shows: Statistics, Featured places/trips/hotels
```

**Use Case:** Landing page, public browsing

### User Dashboard (Authenticated)
```typescript
GET /dashboard/user
Headers: { Authorization: `Bearer ${token}` }
// Shows: Personal stats, reservations, upcoming trips
```

**Use Case:** User profile page, booking history

### Admin Dashboard (Admin Only)
```typescript
GET /dashboard/admin
Headers: { Authorization: `Bearer ${adminToken}` }
// Shows: System stats, revenue, all reservations, user management
```

**Use Case:** Admin control panel

---

## Key Flows for Dashboard

### Browse Flow (All Users)
```
1. GET /browse/countries → Show country list
2. GET /browse/cities?countryId={id} → Show cities in country
3. GET /browse/places?cityId={id} → Show places in city
4. GET /browse/places/:id → Show place details
5. GET /browse/hotels?cityId={id} → Show hotels
6. GET /browse/trips?cityId={id} → Show trips
```

### Booking Flow (Authenticated Users)
```
1. Browse hotels/trips → GET /browse/hotels or /browse/trips
2. View details → GET /hotels/:id or /trips/:id
3. Create reservation → POST /reservations or /trip-reservations
4. View my bookings → GET /reservations/me or /trip-reservations/me
5. Cancel booking → PATCH /reservations/me/:id/status (status: "CANCELLED")
```

### Admin Management Flow
```
Content Management:
- Create: POST /countries, /cities, /places, /hotels, /trips
- Update: PATCH /{resource}/:id
- Delete: DELETE /{resource}/:id

Reservation Management:
- View all: GET /reservations, /trip-reservations
- Update status: PATCH /reservations/:id/status, /trip-reservations/:id/status

User Management:
- Create user: POST /auth/register
- View dashboard: GET /dashboard/admin
```

---

## TypeScript Types (Recommended)

```typescript
// types/api.ts

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  countryId: string;
  country: Country;
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  location?: string;
  imageUrls: string[];
  cityId: string;
  city: City;
  categories: Category[];
  themes: Theme[];
  activities: Activity[];
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  cityId: string;
  city: City;
  pricePerNight: number;
  roomTypes: RoomType[];
  trips?: Trip[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  hotel: Hotel;
  name: string;
  description?: string;
  maxGuests: number;
  pricePerNight: number;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  cityId: string;
  city: City;
  hotelId?: string;
  hotel?: Hotel;
  activities: Activity[];
  price: number;
  reservations?: TripReservation[];
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  user?: User;
  roomTypeId: string;
  roomType: RoomType;
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface TripReservation {
  id: string;
  userId: string;
  user?: User;
  tripId: string;
  trip: Trip;
  guests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface GuestDashboard {
  statistics: {
    countries: number;
    cities: number;
    places: number;
    activities: number;
    hotels: number;
    trips: number;
  };
  featured: {
    places: Place[];
    trips: Trip[];
    hotels: Hotel[];
  };
}

export interface UserDashboard {
  user: User;
  statistics: {
    totalReservations: number;
    hotelReservations: number;
    tripReservations: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    totalSpent: number;
  };
  reservations: {
    hotels: Reservation[];
    trips: TripReservation[];
    upcoming: Array<Reservation | TripReservation>;
  };
}

export interface AdminDashboard {
  statistics: {
    users: {
      total: number;
      admins: number;
      regular: number;
    };
    content: {
      countries: number;
      cities: number;
      places: number;
      activities: number;
      hotels: number;
      trips: number;
    };
    reservations: {
      total: number;
      hotel: number;
      trip: number;
      pending: number;
      confirmed: number;
      cancelled: number;
    };
    revenue: {
      total: number;
      hotel: number;
      trip: number;
      thisMonth: number;
      lastMonth: number;
      growth: number;
    };
  };
  recent: {
    users: User[];
    reservations: Reservation[];
    tripReservations: TripReservation[];
  };
  insights: {
    popularDestinations: Array<{
      id: string;
      name: string;
      country: string;
      places: number;
      hotels: number;
      trips: number;
    }>;
    reservationTrends: {
      last7Days: { hotel: number; trip: number; total: number };
      last30Days: { hotel: number; trip: number; total: number };
    };
  };
}
```

---

## React Hook Examples

### useAuth Hook
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setToken(response.accessToken);
    setUser(response.user);
    localStorage.setItem('auth_token', response.accessToken);
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const fetchUser = async (token: string) => {
    try {
      const userData = await api.get('/auth/me', token);
      setUser(userData);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  return { user, token, login, logout, loading };
};
```

### useDashboard Hook
```typescript
// hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useDashboard = (type: 'guest' | 'user' | 'admin') => {
  const { token, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let endpoint = '/dashboard/guest';
        if (type === 'user' && token) {
          endpoint = '/dashboard/user';
        } else if (type === 'admin' && token && user?.role === 'ADMIN') {
          endpoint = '/dashboard/admin';
        }
        
        const response = await api.get(endpoint, token);
        setData(response);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [type, token, user]);

  return { data, loading };
};
```

---

## Route Protection Examples

### Next.js Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Admin routes
  if (path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Verify admin role (you'd need to decode JWT or make API call)
  }

  // Protected user routes
  if (path.startsWith('/dashboard') && path !== '/dashboard/guest') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
```

### Component-Level Protection
```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading || !user) return <div>Loading...</div>;
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  return <>{children}</>;
};
```

---

## Common Patterns

### API Client with Error Handling
```typescript
// lib/api.ts
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}

export const api = {
  async request(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  },

  get: (endpoint: string, token?: string) =>
    api.request(endpoint, { method: 'GET' }, token),

  post: (endpoint: string, data: any, token?: string) =>
    api.request(
      endpoint,
      { method: 'POST', body: JSON.stringify(data) },
      token
    ),

  patch: (endpoint: string, data: any, token?: string) =>
    api.request(
      endpoint,
      { method: 'PATCH', body: JSON.stringify(data) },
      token
    ),

  delete: (endpoint: string, token?: string) =>
    api.request(endpoint, { method: 'DELETE' }, token),
};
```

### File Upload Helper
```typescript
// lib/upload.ts
export const uploadFile = async (
  file: File,
  endpoint: string,
  token?: string
) => {
  const formData = new FormData();
  formData.append('image', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return response.json();
};
```

---

## Dashboard Page Structure Recommendations

### Guest Dashboard Page
```typescript
// app/dashboard/guest/page.tsx
import { useDashboard } from '@/hooks/useDashboard';

export default function GuestDashboard() {
  const { data, loading } = useDashboard('guest');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome to Tourism</h1>
      <Stats stats={data.statistics} />
      <FeaturedPlaces places={data.featured.places} />
      <FeaturedTrips trips={data.featured.trips} />
      <FeaturedHotels hotels={data.featured.hotels} />
    </div>
  );
}
```

### User Dashboard Page
```typescript
// app/dashboard/user/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useDashboard } from '@/hooks/useDashboard';

export default function UserDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { data, loading } = useDashboard('user');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Dashboard</h1>
      <UserStats stats={data.statistics} />
      <MyReservations reservations={data.reservations} />
      <UpcomingTrips upcoming={data.reservations.upcoming} />
    </div>
  );
}
```

### Admin Dashboard Page
```typescript
// app/admin/dashboard/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useDashboard } from '@/hooks/useDashboard';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { data, loading } = useDashboard('admin');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <SystemStats stats={data.statistics} />
      <RevenueChart revenue={data.statistics.revenue} />
      <RecentReservations reservations={data.recent.reservations} />
      <PopularDestinations destinations={data.insights.popularDestinations} />
    </div>
  );
}
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Testing Endpoints

Use these test endpoints during development:

```typescript
// Test login
const testLogin = async () => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123',
    }),
  });
  const data = await response.json();
  console.log('Token:', data.accessToken);
};
```

---

## Next Steps

1. ✅ Set up API client with error handling
2. ✅ Create authentication context/hooks
3. ✅ Implement route protection
4. ✅ Build dashboard components for each role
5. ✅ Add form handling for reservations/bookings
6. ✅ Implement admin management interfaces
7. ✅ Add loading states and error handling
8. ✅ Style with your design system

For complete API reference, see `API_DOCUMENTATION.md`

