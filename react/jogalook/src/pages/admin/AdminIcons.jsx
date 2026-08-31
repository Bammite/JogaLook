import React from 'react';

const iconClass = 'admin-icon';

export function Icon({ children, className = '', ...props }) {
  return (
    <span className={`${iconClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

export const OverviewIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  </Icon>
);

export const ProductIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7H21L19 21H5L3 7Z" />
      <path d="M7 7V4H17V7" />
    </svg>
  </Icon>
);

export const VariantIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H18" />
      <path d="M6 12H18" />
      <path d="M6 21H18" />
      <path d="M10 3V21" />
      <path d="M14 12V21" />
    </svg>
  </Icon>
);

export const CategoryIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7H10L12 9H21V21H3V7Z" />
      <path d="M3 7L12 3L21 7" />
    </svg>
  </Icon>
);

export const TemplateIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7H17V17H7V7Z" />
      <path d="M7 12H17" />
    </svg>
  </Icon>
);

export const CustomizationIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20H21" />
      <path d="M16.5 3.5L20.5 7.5" />
      <path d="M7 13L3 21H11L20 12L16 8L7 13Z" />
    </svg>
  </Icon>
);

export const OrderIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3H5L7 15H17L19 7H7" />
      <path d="M16 21C16.5523 21 17 20.5523 17 20C17 19.4477 16.5523 19 16 19C15.4477 19 15 19.4477 15 20C15 20.5523 15.4477 21 16 21Z" />
      <path d="M7 21C7.55228 21 8 20.5523 8 20C8 19.4477 7.55228 19 7 19C6.44772 19 6 19.4477 6 20C6 20.5523 6.44772 21 7 21Z" />
    </svg>
  </Icon>
);

export const CartIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1H5L7.68 13.39C7.851 14.362 8.668 15 9.653 15H19C19.552 15 20 14.552 20 14C20 13.601 19.800 13.25 19.470 13.073" />
      <path d="M16 13L17.5 8H6" />
    </svg>
  </Icon>
);

export const PaymentIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10H22" />
      <path d="M6 16H10" />
    </svg>
  </Icon>
);

export const DeliveryIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13H16V19H3V13Z" />
      <path d="M16 13L19 8H22V19H20" />
      <circle cx="7" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  </Icon>
);

export const UserIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" />
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
    </svg>
  </Icon>
);

export const ShopIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9H21" />
      <path d="M5 9V5H19V9" />
      <path d="M3 9L4 20H20L21 9" />
      <path d="M9 14H15" />
      <path d="M9 18H15" />
    </svg>
  </Icon>
);

export const SupplierIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8L12 3L21 8V21H3Z" />
      <path d="M8 21V12H16V21" />
    </svg>
  </Icon>
);

export const LogIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H15" />
      <path d="M9 7H15" />
      <path d="M9 11H15" />
      <path d="M4 21V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V21H4Z" />
    </svg>
  </Icon>
);

export const LogsIcon = LogIcon;

export const NewsIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4H20V20H4Z" />
      <path d="M8 8H16" />
      <path d="M8 12H16" />
      <path d="M8 16H13" />
    </svg>
  </Icon>
);

export const AddIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </Icon>
);

export const CloseIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </Icon>
);

export const EditIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  </Icon>
);

export const EyeIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6H5H21" />
      <path d="M19 6L18.3333 19.3333C18.3333 20.1471 17.6471 20.8333 16.8333 20.8333H7.16667C6.35286 20.8333 5.66667 20.1471 5.66667 19.3333L5 6" />
      <path d="M9 6V4.66667C9 3.79086 9.79086 3 10.6667 3H13.3333C14.2091 3 15 3.79086 15 4.66667V6" />
      <path d="M10 11V17" />
      <path d="M14 11V17" />
    </svg>
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  </Icon>
);

export const LockIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  </Icon>
);

export const ClockIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 3" />
    </svg>
  </Icon>
);

export const EmptyIcon = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7H21" />
      <path d="M21 7L16 21H8L3 7" />
      <path d="M7 12H17" />
    </svg>
  </Icon>
);

export const iconMap = {
  overview: <OverviewIcon />,
  products: <ProductIcon />,
  variants: <VariantIcon />,
  categories: <CategoryIcon />,
  templates: <TemplateIcon />,
  customizations: <CustomizationIcon />,
  orders: <OrderIcon />,
  carts: <CartIcon />,
  payments: <PaymentIcon />,
  deliveries: <DeliveryIcon />,
  users: <UserIcon />,
  shops: <ShopIcon />,
  suppliers: <SupplierIcon />,
  logs: <LogIcon />,
  add: <AddIcon />,
  close: <CloseIcon />,
  eye: <EyeIcon />,
  trash: <TrashIcon />,
  search: <SearchIcon />,
  empty: <EmptyIcon />,
};
