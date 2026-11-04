'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    FB?: { XFBML: { parse: (el?: Element) => void } };
  }
}

const PAGE_URL = 'https://www.facebook.com/valleyoakwinery/';

// Facebook Page plugin (timeline + events), same settings as the original site.
export default function FacebookFeed() {
  const ref = useRef<HTMLDivElement>(null);

  // If the SDK is already loaded (e.g. this component remounted), re-render the plugin.
  useEffect(() => {
    if (window.FB && ref.current) window.FB.XFBML.parse(ref.current);
  }, []);

  return (
    <div ref={ref} className="mt-[30px]">
      <div id="fb-root" />
      <div
        className="fb-page"
        data-href={PAGE_URL}
        data-tabs="timeline, events"
        data-small-header="false"
        data-adapt-container-width="true"
        data-width="400"
        data-height="700"
        data-adapt-container-height="true"
        data-hide-cover="false"
        data-show-facepile="false"
      >
        <blockquote cite={PAGE_URL} className="fb-xfbml-parse-ignore">
          <a href={PAGE_URL}>Valley Oak Winery</a>
        </blockquote>
      </div>
      <Script
        id="facebook-jssdk"
        src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&autoLogAppEvents=1&version=v3.1&appId=306063046616609"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
    </div>
  );
}
