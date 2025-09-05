"use client";

import {usePathname, useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { useLocale } from "next-intl";
import { Globe2 } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.push(`/${nextLocale}${pathname.replace(/^\/(en|ur)/, "")}`);
  };

  return (
    <div className="px-2 py-2 mt-2 border-t">
      <div 
        onClick={toggleLocale}
        className={`
          relative flex items-center cursor-pointer rounded-lg
          bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20
          hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30
          transition-all duration-300 ease-in-out transform hover:scale-[1.02]
          border border-blue-200/50 dark:border-blue-800/30
          ${state === "collapsed" ? "justify-center p-2" : "justify-between p-3"}
        `}
        title={locale === "en" ? "Switch to Urdu" : "Switch to English"}
      >
        <div className={`flex items-center ${state === "collapsed" ? "" : "gap-3"}`}>
          <div className="relative">
            <Globe2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
          </div>
          
          {state !== "collapsed" && (
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Language
              </span>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {locale === "en" ? "English" : "اردو"}
              </span>
            </div>
          )}
        </div>

        {state !== "collapsed" && (
          <div className="flex items-center">
            <div className="text-xs bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {locale === "en" ? "UR" : "EN"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
