import Script from 'next/script';
import { Panel } from '@/components/site/SiteShell';

// Instagram feed via LightWidget, same widget as the original site.
export default function PicturesPage() {
  return (
    <Panel className="min-h-[750px] min-w-[266px] rounded-none bg-white/80">
      <Script src="https://cdn.lightwidget.com/widgets/lightwidget.js" strategy="lazyOnload" />
      <iframe
        title="Valley Oak Winery on Instagram"
        src="https://lightwidget.com/widgets/2d7b4492e7ed50338a4977632b6e9050.html"
        scrolling="yes"
        className="lightwidget-widget h-full min-h-[750px] w-full overflow-y-scroll border-0"
      />
    </Panel>
  );
}
