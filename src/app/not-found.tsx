import Link from 'next/link';
import SiteShell, { Panel } from '@/components/site/SiteShell';

export default function NotFound() {
  return (
    <SiteShell>
      <Panel className="bg-white/90">
        <h1 className="my-[0.67em] text-[2em] font-normal">Page not found</h1>
        <p className="my-4">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <Link href="/" className="inline-block rounded px-4 text-sm font-medium leading-9 hover:bg-black/[.04]">
          Back to Our Story
        </Link>
      </Panel>
    </SiteShell>
  );
}
