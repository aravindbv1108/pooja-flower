import { format } from 'date-fns';

// Indian number formatting: ₹1,25,000
export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatNumber = (num = 0) => new Intl.NumberFormat('en-IN').format(num || 0);

export const formatDate = (date) => (date ? format(new Date(date), 'dd/MM/yyyy') : '-');

export const formatDateLong = (date) => (date ? format(new Date(date), 'dd MMM yyyy') : '-');

export const toInputDate = (date) => (date ? format(new Date(date), 'yyyy-MM-dd') : '');
