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

// This is sample data.


 

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.svg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
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
  ...props
}) {

  const { language, toggleLanguage, t } = useLanguage();
const menuItems  = [
  {
    title: "Dashboard",
    id: "dashboard",
    url: "#",
    items: [
      { title: "Overview", url: "/dashboard" },

    ],
  },
  {
    title: "Products",
    id: "products",
    url: "#",
    items: [
      { title: "All Products", url: "/dashboard/allProducts" },
    ],
  },
  {
    title: "Sales",
    id: "sales",
    url: "#",
    items: [
      { title: "Sales", url: "/dashboard/sales" },
    
    ],
  },
  {
    title: "Loans",
    id: "loans",
    url: "#",
    items: [
      { title: "History", url: "/dashboard/loans" },
    ],
  },
  {
    title: "Ograi",
    id: "ograi",
    url: "#",
    items: [
      { title: "Pending", url: "/dashboard/ograi" },
      { title: "Cleared", url: "#" },
    ],
  },
  {
    title: "Returns",
    id: "returns",
    url: "#",
    items: [
      { title: "Product Returns", url: "/dashboard/return" },
    ],
  },
  {
    title: "Reports",
    id: "reports",
    url: "#",
    items: [
      { title: "Monthly", url: "/dashboard/reports" },
      { title: "Annual", url: "#" },
    ],
  },
];
;

  return (
    <Sidebar collapsible="icon" {...props}>
     
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} menuItems={menuItems}/>
    
      </SidebarContent>
      {/* <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent> */}
      <SidebarFooter>
        <NavUserWithCleaner user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
