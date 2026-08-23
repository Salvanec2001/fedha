// Maps category names to an emoji + color, mirroring the colorful icon-grid
// pattern from budget-tracker apps — much faster to scan and tap than a
// plain text dropdown, especially on mobile.
export const CATEGORY_STYLE: Record<string, { icon: string; bg: string }> = {
  Food: { icon: '🍔', bg: '#F59E0B' },
  Rent: { icon: '🏠', bg: '#F97316' },
  Electricity: { icon: '💡', bg: '#EAB308' },
  Water: { icon: '💧', bg: '#3B82F6' },
  Internet: { icon: '🌐', bg: '#3B82F6' },
  Transportation: { icon: '🚗', bg: '#0EA5E9' },
  Healthcare: { icon: '🏥', bg: '#EF4444' },
  Insurance: { icon: '🛡️', bg: '#6366F1' },
  Education: { icon: '🎓', bg: '#8B5CF6' },
  Clothing: { icon: '👕', bg: '#A855F7' },
  Entertainment: { icon: '🎬', bg: '#A855F7' },
  'Eating Out': { icon: '🍽️', bg: '#EF4444' },
  Shopping: { icon: '🛍️', bg: '#EC4899' },
  Subscriptions: { icon: '📱', bg: '#6B7280' },
  'Family Support': { icon: '👨‍👩‍👧', bg: '#10B981' },
  Gifts: { icon: '🎁', bg: '#EC4899' },
  Weddings: { icon: '💍', bg: '#EC4899' },
  Emergencies: { icon: '🚨', bg: '#EF4444' },
  'Debt Payments': { icon: '💳', bg: '#EF4444' },
  Savings: { icon: '🐷', bg: '#10B981' },
  Investments: { icon: '📈', bg: '#10B981' },
  'Bank Fees': { icon: '🏦', bg: '#6B7280' },
  'Business Capital': { icon: '💼', bg: '#0EA5E9' },
  Equipment: { icon: '🔧', bg: '#6B7280' },
  Operations: { icon: '⚙️', bg: '#6B7280' },
  Salary: { icon: '💰', bg: '#10B981' },
  Freelance: { icon: '💻', bg: '#0EA5E9' },
  'Business Income': { icon: '🏢', bg: '#10B981' },
  'Other Income': { icon: '➕', bg: '#10B981' },
};

export function categoryStyle(name: string) {
  return CATEGORY_STYLE[name] ?? { icon: '📦', bg: '#9CA3AF' };
}
