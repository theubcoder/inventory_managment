"use client"

import { usePathname } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

const routeMap = {
  '/dashboard': { title: 'Dashboard', parent: null },
  '/dashboard/allProducts': { title: 'All Products', parent: '/dashboard' },
  '/dashboard/sales': { title: 'Sales', parent: '/dashboard' },
  '/dashboard/loans': { title: 'Loans History', parent: '/dashboard' },
  '/dashboard/ograi': { title: 'Ograi Pending', parent: '/dashboard' },
  '/dashboard/ograi/cleared': { title: 'Ograi Cleared', parent: '/dashboard/ograi' },
  '/dashboard/return': { title: 'Product Returns', parent: '/dashboard' },
  '/dashboard/reports': { title: 'Reports', parent: '/dashboard' },
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  const buildBreadcrumbs = (currentPath) => {
    const breadcrumbs = []
    let path = currentPath
    
    while (path && routeMap[path]) {
      breadcrumbs.unshift({
        path,
        title: routeMap[path].title,
        isLast: path === currentPath
      })
      path = routeMap[path].parent
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = buildBreadcrumbs(pathname)
  
  if (breadcrumbs.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
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