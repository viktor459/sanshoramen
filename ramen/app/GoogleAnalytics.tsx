"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function GAPageTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", gaId, { page_path: url });
    }
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  if (!GA_ID) return null;

  return (
    <>
      {/* Consent mode defaults — must run before gtag loads */}
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            wait_for_update: 500,
          });
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });

          // Restore consent if already given
          try {
            var stored = JSON.parse(localStorage.getItem('cookie-consent-v2') || 'null');
            if (stored && stored.analytics) {
              gtag('consent', 'update', { analytics_storage: 'granted' });
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            }
          } catch(e) {}
        `}
      </Script>
      <Suspense fallback={null}>
        <GAPageTracker gaId={GA_ID} />
      </Suspense>
    </>
  );
}
