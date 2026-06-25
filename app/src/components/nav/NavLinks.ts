export type NavIcon = "calendar" | "book" | "download" | "list" | "pantry";

export interface NavLink {
  href: string;
  label: string;
  icon: NavIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "This Week", icon: "calendar" },
  { href: "/recipes", label: "Recipes", icon: "book" },
  { href: "/import", label: "Import", icon: "download" },
  { href: "/grocery", label: "Grocery", icon: "list" },
  { href: "/pantry", label: "Pantry", icon: "pantry" },
];
