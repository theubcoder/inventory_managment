"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Utensils,
  Home,
  Package,
  ShoppingCart,
  Coins,
  CreditCard,
  RotateCcw,
  FileText,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { NavUserWithCleaner } from "@/components/nav-user-with-cleaner"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/contexts/LanguageContext"
import LocaleSwitcher from "@/LocaleSwitcher"
import { useLocale } from "next-intl"

// This is sample data.


 

const data = {
  user: {
    name: "Admin",
    email: "thenaeemullahpk@gmail.com",
    avatar: "/avatars/admin.svg",
  },
  teams: [
    {
      name: "Naeem Ullah",
      logo: Utensils,
      plan: "Bartan Store",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],

}

export function AppSidebar({
  session,
  ...props
}) {

  const { language, toggleLanguage, t } = useLanguage();
const menuItems  = [
  {
    title: "Dashboard",
    id: "dashboard",
    url: "#",
    icon: Home,
    items: [
      { title: "Overview", url: "/dashboard" },

    ],
  },
  {
    title: "Products",
    id: "products",
    url: "#",
    icon: Package,
    items: [
      { title: "All Products", url: "/dashboard/allProducts" },
    ],
  },
  {
    title: "Sales",
    id: "sales",
    url: "#",
    icon: ShoppingCart,
    items: [
      { title: "Sales", url: "/dashboard/sales" },
    
    ],
  },
  {
    title: "Loans",
    id: "loans",
    url: "#",
    icon: Coins,
    items: [
      { title: "History", url: "/dashboard/loans" },
    ],
  },
  {
    title: "Ograi",
    id: "ograi",
    url: "#",
    icon: CreditCard,
    items: [
      { title: "Pending", url: "/dashboard/ograi" },
      { title: "Cleared", url: "/dashboard/ograi/cleared" },
    ],
  },
  {
    title: "Returns",
    id: "returns",
    url: "#",
    icon: RotateCcw,
    items: [
      { title: "Product Returns", url: "/dashboard/return" },
    ],
  },
  {
    title: "Reports",
    id: "reports",
    url: "/dashboard/reports",
    icon: FileText,
    items: [],
  },
];

const menuItemsUr = [
  {
    title: "ڈیش بورڈ",
    id: "dashboard",
    url: "#",
    icon: Home,
    items: [
      { title: "جائزہ", url: "/dashboard" },
    ],
  },
  {
    title: "مصنوعات",
    id: "products",
    url: "#",
    icon: Package,
    items: [
      { title: "تمام مصنوعات", url: "/dashboard/allProducts" },
    ],
  },
  {
    title: "فروخت",
    id: "sales",
    url: "#",
    icon: ShoppingCart,
    items: [
      { title: "فروخت", url: "/dashboard/sales" },
    ],
  },
  {
    title: "قرضے",
    id: "loans",
    url: "#",
    icon: Coins,
    items: [
      { title: "تاریخچہ", url: "/dashboard/loans" },
    ],
  },
  {
    title: "اوگرائی",
    id: "ograi",
    url: "#",
    icon: CreditCard,
    items: [
      { title: "زیر التواء", url: "/dashboard/ograi" },
      { title: "کلیئر", url: "/dashboard/ograi/cleared" },
    ],
  },
  {
    title: "واپسی",
    id: "returns",
    url: "#",
    icon: RotateCcw,
    items: [
      { title: "مصنوعات کی واپسی", url: "/dashboard/return" },
    ],
  },
  {
    title: "رپورٹس",
    id: "reports",
    url: "/dashboard/reports",
    icon: FileText,
    items: [],
  },
];

;
  const locale = useLocale();
  const dir = locale === "ur" ? "ur" : "en";



  return (
    <Sidebar collapsible="icon" {...props}     side={dir === "ur" ? "right" : "left"}> 
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} menuItems={menuItems} menuItemsUr={menuItemsUr}/> 
        <LocaleSwitcher/>
      </SidebarContent>
      {/* <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent> */}
      <SidebarFooter>
        <NavUserWithCleaner user={session?.user || data.user} />
      </SidebarFooter>
      <SidebarRail />

    </Sidebar>
  );
}
