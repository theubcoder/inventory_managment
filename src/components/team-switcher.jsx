"use client"

import * as React from "react"
import { useTranslations, useLocale } from 'next-intl'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams
}) {
  const t = useTranslations('Navigation')
  const locale = useLocale()
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default">
          <div
            className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-white">
            {typeof activeTeam.logo === 'string' ? (
              <img 
                src={activeTeam.logo} 
                alt="Store Logo" 
                width="24"
                height="24"
                className="object-contain"
              />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{locale === 'ur' ? 'نعیم اللہ' : activeTeam.name}</span>
            <span className="truncate text-xs">{locale === 'ur' ? 'برتن اسٹور' : activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
