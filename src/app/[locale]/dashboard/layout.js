import "@/app/globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { routing } from "@/i18n/routing";
import { Separator } from "@radix-ui/react-dropdown-menu";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import { notFound } from "next/navigation";


export default async function DashboardLayout({ children, params }) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // ✅ locale ke hisaab se direction choose karein
  const dir = locale === "ur" ? "rtl" : "ltr";


  return (
    <div dir={dir} className={locale === 'ur' ? 'locale-ur' : ''}>
      <NextIntlClientProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <DynamicBreadcrumb />
              </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </NextIntlClientProvider>
    </div>
  );
}
