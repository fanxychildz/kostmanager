/**
 * Types for KostManager Applet
 */

export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatarUrl: string;
  quote: string;
  stars: number;
}

export interface PricingPlan {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  periodLabel: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  badge?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface MockTenant {
  id: string;
  roomNumber: string;
  name: string;
  phone: string;
  monthlyRent: number;
  status: "Lunas" | "Belum Bayar";
  dueDate: string;
  whatsappSent?: boolean;
  notes?: string;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  details: string;
}
