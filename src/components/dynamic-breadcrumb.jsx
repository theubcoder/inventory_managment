"use client"

import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const t = useTranslations('Navigation')
  const locale = useLocale()
  const isRTL = locale === 'ur'
  
  // Remove locale from pathname for routing
  const cleanPathname = pathname.replace(/^\/(en|ur)/, '')
  
  const routeMap = {
    '/dashboard': { title: t('dashboard'), parent: null },
    '/dashboard/allProducts': { title: t('allProducts'), parent: '/dashboard' },
    '/dashboard/sales': { title: t('sales'), parent: '/dashboard' },
    '/dashboard/loans': { title: t('loansHistory'), parent: '/dashboard' },
    '/dashboard/ograi': { title: t('ograiPending'), parent: '/dashboard' },
    '/dashboard/ograi/cleared': { title: t('ograiCleared'), parent: '/dashboard/ograi' },
    '/dashboard/return': { title: t('productReturns'), parent: '/dashboard' },
    '/dashboard/reports': { title: t('reports'), parent: '/dashboard' },
  }
  
  const buildBreadcrumbs = (currentPath) => {
    const breadcrumbs = []
    let path = currentPath
    
    while (path && routeMap[path]) {
      breadcrumbs.unshift({
        path: `/${locale}${path}`,
        title: routeMap[path].title,
        isLast: path === currentPath
      })
      path = routeMap[path].parent
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = buildBreadcrumbs(cleanPathname)
  
  if (breadcrumbs.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{t('dashboard')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.path} className="flex items-center">
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.path}>
                  {breadcrumb.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!breadcrumb.isLast && (
              <BreadcrumbSeparator className="mx-2" />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}