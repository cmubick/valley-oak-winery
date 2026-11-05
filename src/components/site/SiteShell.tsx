import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import FacebookFeed from './FacebookFeed';

// Public site chrome: toolbar, page content beside the Facebook feed, footer — all over the
// vineyard background photo, matching the original Angular layout.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    // flex-col + flex-1 on the content row keeps the footer at the bottom of the window on short pages.
    <div className="flex min-h-screen flex-col bg-[url(/images/Belmont-026.jpg)] bg-cover bg-fixed bg-center bg-no-repeat text-center font-serif leading-[normal] text-black">
      <SiteHeader />
      <div className="flex flex-1 flex-col min-[960px]:flex-row">
        <main className="min-w-0 min-[960px]:flex-1">{children}</main>
        <aside className="flex justify-center px-4 min-[960px]:w-[464px] min-[960px]:shrink-0 min-[960px]:pl-8 min-[960px]:pr-8">
          <FacebookFeed />
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}

// White content panel used by Our Story, Pictures and the 404 page.
export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-4 my-6 rounded-[3px] p-6 [&_p]:my-[1em] text-left sm:mx-8 ${className}`}>{children}</div>;
}
