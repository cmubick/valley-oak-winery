import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy | Valley Oak Winery' };

const EFFECTIVE = 'November 4, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-4 my-6 bg-white/90 pb-[75px] text-left sm:mx-8">
      <div className="flex justify-center pb-2 pt-8 text-[22px] font-semibold">Privacy Policy</div>
      <div className="p-8 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:font-semibold [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-8">
        <p className="italic">Effective {EFFECTIVE}</p>

        <p>
          This policy explains what information the Valley Oak Winery website (valleyoakwinery.com) collects and how
          it is used. Valley Oak Winery, LLC (&ldquo;we&rdquo;) runs this site.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Mailing list.</strong> If you sign up for our mailing list, we collect the email address (and name,
            if given) you enter. Sign-ups are handled by Mailchimp and used only to send you winery news and events.
            You can unsubscribe at any time using the link in any email.
          </li>
          <li>
            <strong>Messages.</strong> If you email or call us, we keep what you send so we can reply.
          </li>
          <li>
            <strong>Basic server logs.</strong> Our hosting provider (Amazon Web Services) records standard request
            information such as IP address, browser type and pages visited, for security and reliability.
          </li>
        </ul>
        <p>We do not sell, rent or trade personal information, and we do not run advertising on this site.</p>

        <h2>Instagram and Facebook</h2>
        <p>
          Our Pictures page shows recent public posts from our own Instagram account, @valleyoakwinery. We use
          Meta&apos;s API only to read our own account&apos;s posts (images, captions and links). We do not collect or
          store information about visitors, followers or any other Instagram or Facebook users.
        </p>
        <p>
          Some pages show our Facebook Page feed. That content is loaded from Facebook, which may set its own cookies
          under{' '}
          <a className="underline" href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
            Meta&apos;s privacy policy
          </a>
          .
        </p>

        <h2>Other services</h2>
        <ul>
          <li>
            <strong>Google Maps</strong> shows our location, under{' '}
            <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Mailchimp</strong> handles mailing-list sign-ups, under{' '}
            <a className="underline" href="https://www.intuit.com/privacy/statement/" target="_blank" rel="noopener noreferrer">
              Intuit Mailchimp&apos;s privacy statement
            </a>
            .
          </li>
          <li>
            <strong>Adobe Fonts</strong> provides some of the site&apos;s fonts.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          The site itself sets cookies only for staff who sign in to manage the wine list. The third-party services
          above may set their own cookies.
        </p>

        <h2 id="data-deletion">Your choices and data deletion</h2>
        <p>
          To unsubscribe, use the link in any of our emails. To see, correct or delete any information we hold about
          you, email{' '}
          <a className="underline" href="mailto:info@valleyoakwinery.com">
            info@valleyoakwinery.com
          </a>{' '}
          and we will respond within 30 days. Because our Instagram integration stores no information about anyone
          other than the winery, there is no Instagram or Facebook user data for us to delete.
        </p>

        <h2>Children</h2>
        <p>This site is intended for adults of legal drinking age and is not directed to children.</p>

        <h2>Changes</h2>
        <p>If we change this policy, we will update it here and change the effective date above.</p>

        <h2>Contact</h2>
        <p>
          Valley Oak Winery, LLC
          <br />
          11809 E Belmont Ave, Sanger, CA 93657
          <br />
          <a className="underline" href="mailto:info@valleyoakwinery.com">
            info@valleyoakwinery.com
          </a>{' '}
          · 559.940.6040
        </p>
      </div>
    </div>
  );
}
