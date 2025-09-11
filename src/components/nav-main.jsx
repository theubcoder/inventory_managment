"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ menuItems, menuItemsUr }) {
  const locale = useLocale();
  const items = locale === "ur" ? menuItemsUr : menuItems;
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();

  // Remove locale prefix from pathname for comparison
  const currentPath = pathname.replace(`/${locale}`, '') || '/';

  const handleNavigation = (e, url) => {
    e.preventDefault();
    setIsNavigating(true);
    
    // Close mobile sidebar
    if (isMobile) {
      setOpenMobile(false);
    }
    
    // Navigate after a small delay to show loading state
    setTimeout(() => {
      router.push(url);
      setIsNavigating(false);
    }, 100);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.id}
              asChild
              defaultOpen={item.items?.some(subItem => currentPath === subItem.url) || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={item.items?.some(subItem => currentPath === subItem.url)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {locale === "en" ? (
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    ) : (
                      <ChevronLeft className="mr-auto transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={currentPath === subItem.url}
                        >
                          <Link 
                            href={subItem.url}
                            onClick={(e) => handleNavigation(e, subItem.url)}
                            className={currentPath === subItem.url ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                          >
                            <span>{subItem.title}</span>
                            {isNavigating && <span className="ml-2 text-xs">...</span>}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                isActive={currentPath === item.url}
              >
                <Link 
                  href={item.url}
                  onClick={(e) => handleNavigation(e, item.url)}
                  className={currentPath === item.url ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {isNavigating && <span className="ml-2 text-xs">...</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
