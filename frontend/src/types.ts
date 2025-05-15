// frontend/src/types.ts

// Benutzertypen
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'office' | 'manager' | 'developer' | 'admin';
  locations: Location[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Standorttypen
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Einladungstypen
export interface Invitation {
  id: string;
  email: string;
  role: 'teacher' | 'office' | 'manager' | 'developer' | 'admin';
  locationId: string;
  location?: Location;
  token: string;
  isAccepted: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// Kurstypen
export interface Course {
  id: string;
  name: string;
  description?: string;
  subject: string;
  startDate: string;
  endDate: string;
  locationId: string;
  location?: Location;
  teacherId: string;
  teacher?: User;
  studentIds: string[];
  students?: Student[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Schülertypen
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhoneNumber?: string;
  notes?: string;
  courseIds: string[];
  courses?: Course[];
  locationId: string;
  location?: Location;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Unterrichtsstundentypen
export interface Lesson {
  id: string;
  courseId: string;
  course?: Course;
  date: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: User;
  locationId: string;
  location?: Location;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  attendances?: Attendance[];
  createdAt: string;
  updatedAt: string;
}

// Anwesenheitstypen
export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  student?: Student;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Abrechnungsperioden
export interface BillingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  locationId: string;
  location?: Location;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Rechnungen
export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  student?: Student;
  billingPeriodId: string;
  billingPeriod?: BillingPeriod;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Benachrichtigungen
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

// Paginierungstyp
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter- und Sortieroptionen
export interface FilterOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  locationId?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Dashboard Statistiken
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  activeCourses: number;
  upcomingLessons: number;
  recentlyCompletedLessons: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

// Rollen und Berechtigungen
export type UserRole = 'teacher' | 'office' | 'manager' | 'developer' | 'admin';

export interface Permission {
  name: string;
  description: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// API Fehlertyp
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

// Einstellungen
export interface Settings {
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyLogo?: string;
  invoicePrefix?: string;
  taxRate?: number;
  currency?: string;
  language?: string;
  timeZone?: string;
  theme?: 'light' | 'dark' | 'system';
}
