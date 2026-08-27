/** Minimal inline stroke icons for the header — no icon library dependency. */

type IconProps = { className?: string };

export function HeartIcon({ className = 'h-5 w-5', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 20.5s-7-4.35-9.5-8.86C.85 8.4 2.1 5 5.5 4.3c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.4.7 4.65 4.1 3 7.34C19 16.15 12 20.5 12 20.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 3.5 5 6v5.2c0 4.4 2.9 7.9 7 9.3 4.1-1.4 7-4.9 7-9.3V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="M9 12.2 11.2 14.4 15.3 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function StoreIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 9.5 5 4h14l1 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5.5h5V20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DocumentIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M6 3.5h9l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" strokeLinecap="round" />
    </svg>
  );
}

export function GridIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function PlusIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M6 10a6 6 0 0 1 12 0c0 3.2 1 5 1.8 6H4.2C5 15 6 13.2 6 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" strokeLinecap="round" />
    </svg>
  );
}

export function SignOutIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M9 5H5.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 8l4 4-4 4M17 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" strokeLinecap="round" />
    </svg>
  );
}

export function PauseIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8M10.5 8v5M8 10.5h5" strokeLinecap="round" />
    </svg>
  );
}

export function TruckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M3 6.5h10v9H3z" strokeLinejoin="round" />
      <path d="M13 10h4l3 3v2.5h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.75" />
      <circle cx="16.5" cy="17" r="1.75" />
    </svg>
  );
}

export function StarIcon({ className = 'h-4 w-4', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BadgeCheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="m12 2.5 2.2 1.4 2.6-.3 1 2.4 2.4 1-.3 2.6L21.3 12l-1.4 2.2.3 2.6-2.4 1-1 2.4-2.6-.3L12 21.5l-2.2-1.4-2.6.3-1-2.4-2.4-1 .3-2.6L2.7 12l1.4-2.2-.3-2.6 2.4-1 1-2.4 2.6.3L12 2.5Z" strokeLinejoin="round" />
      <path d="M8.5 12.2 11 14.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 3.5 21 19.5H3L12 3.5Z" strokeLinejoin="round" />
      <path d="M12 10v4.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function PhoneIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 13l4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C11.8 18.6 5.4 12.2 5 5.6A1.5 1.5 0 0 1 6.5 4Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4.5 4v-4H4V5.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function FireIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 2.5c1.2 3 3.8 4.6 3.8 8.3a3.8 3.8 0 1 1-7.6 0c0-.9.3-1.6.8-2.3.2 1 .9 1.6 1.7 1.4-.9-2.4.2-4.7 1.3-7.4Z" strokeLinejoin="round" />
    </svg>
  );
}

export function SunIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" strokeLinecap="round" />
    </svg>
  );
}

export function SproutIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 21V12" strokeLinecap="round" />
      <path d="M12 12C12 8 9 6 5 6c0 4 3 7 7 6Z" strokeLinejoin="round" />
      <path d="M12 10c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 6-6 5.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function WheatIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 21V4" strokeLinecap="round" />
      <path d="M12 9.5c-1.5-1-2.5-1-4 0M12 9.5c1.5-1 2.5-1 4 0M12 6.5c-1.3-1-2.2-1-3.5 0M12 6.5c1.3-1 2.2-1 3.5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LeafIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M5 19c8 1 14-4 14-14C10 5 5 10 5 19Z" strokeLinejoin="round" />
      <path d="M5 19c2-4 5-7 9-9.5" strokeLinecap="round" />
    </svg>
  );
}

export function PackageIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 8l8-4 8 4-8 4-8-4Z" strokeLinejoin="round" />
      <path d="M4 8v8l8 4 8-4V8" strokeLinejoin="round" />
      <path d="M12 12v8" />
    </svg>
  );
}

export function UsersIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.7-3.5 2.8-5.5 5.5-5.5s4.8 2 5.5 5.5" strokeLinecap="round" />
      <path d="M16 8.5a2.5 2.5 0 1 0 0-5" strokeLinecap="round" />
      <path d="M15 14.7c2.3.3 3.9 2 4.5 5.3" strokeLinecap="round" />
    </svg>
  );
}

export function LightningIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M9.5 14.5 14.5 9.5" strokeLinecap="round" />
      <path d="M11 6.5 13 4.5a3.5 3.5 0 1 1 5 5l-2 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 17.5 11 19.5a3.5 3.5 0 1 1-5-5l2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CameraIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1-2h6l1 2h2.5A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V8.5Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function EyeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 9.5 6.5 9.5 6.5a13.5 13.5 0 0 1-3.2 3.9M6.6 6.6C4 8.3 2.5 11 2.5 12.5c0 0 3.5 6.5 9.5 6.5a9.6 9.6 0 0 0 2.9-.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 12.9a2.5 2.5 0 0 0 3.5 3.5" strokeLinecap="round" />
      <path d="M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" strokeLinejoin="round" />
      <path d="M14 7l3 3" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M5 21V4" strokeLinecap="round" />
      <path d="M5 4h13l-3 4 3 4H5" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 20V4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6.5" y="13" width="3" height="7" rx="0.5" />
      <rect x="11.5" y="9" width="3" height="11" rx="0.5" />
      <rect x="16.5" y="5.5" width="3" height="14.5" rx="0.5" />
    </svg>
  );
}

export function GearIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 2.5 14 4l2.4-.6 1.4 2.1L20 7l-.6 2.4L21 12l-1.6 1.6L20 17l-2.2 1.4L16.4 21 14 20.4 12 21.5 10 20.4 7.6 21l-1.4-2.6L4 17l.6-2.4L3 12l1.6-1.6L4 7l2.2-1.4L7.6 3.4 10 4Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function MailIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="M4 6.5l8 6.5 8-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryVegetableIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 6.5c-.5-1.5.5-3 2-3M12 6.5c.5-1.5-.5-3-2-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryFruitIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <ellipse cx="12" cy="14.5" rx="6" ry="7" />
      <path d="M12 7.5V3M9 5l1.5 2.5M15 5l-1.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryTuberIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M6 15c-1.5-3 .5-8 5-9.5 4-1.3 8 .5 9 4 1 3.5-1.5 7-5.5 8.5-4 1.5-7-.5-8.5-3Z" strokeLinejoin="round" />
      <circle cx="10.5" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CategoryLegumeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4.5 15.5c0-6 4-11 10-11 2 0 3.5.6 4.5 1.5-1 5-5.5 9-11 9-1.4 0-2.6-.2-3.5-.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="14" r="1.1" />
      <circle cx="13" cy="10.5" r="1.1" />
      <circle cx="16" cy="7.5" r="1.1" />
    </svg>
  );
}

export function CategoryPoultryIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M8 20c0-5 1.5-8 5-8s5 3 5 8" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="3" />
      <path d="M17.3 6.3 19.5 5.5l-1.2 2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryLivestockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <circle cx="12" cy="13" r="5.5" />
      <path d="M8.5 8.5 6.5 4M15.5 8.5 17.5 4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="12" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BasketIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M4 10h16l-1.5 9a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 10Z" strokeLinejoin="round" />
      <path d="M8 10 9 5.5A3 3 0 0 1 12 3a3 3 0 0 1 3 2.5l1 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 14v3M12 14v3M15.5 14v3" strokeLinecap="round" />
    </svg>
  );
}

export function CategoryEggIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 3.5C8.5 8 6 12.5 6 15.5a6 6 0 0 0 12 0C18 12.5 15.5 8 12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

// Two overlapping bubbles — distinct from ChatIcon's single bubble, which is
// already used everywhere for WhatsApp. Keeps in-app Chat visually separate
// wherever the two sit side by side (buy-box, farmer action row).
export function MessageIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5v6A1.5 1.5 0 0 1 13.5 13H9l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 11.5v-6Z" strokeLinejoin="round" />
      <path d="M17.5 9H19a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 18h-.5v3l-3.3-3H10.5A1.5 1.5 0 0 1 9 16.5V15" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" strokeLinecap="round" />
      <path d="M12 17.5V21M9 21h6" strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M20 4 3.5 10.5 11 13l2.5 7.5L20 4Z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M11 13 20 4" strokeLinecap="round" />
    </svg>
  );
}
