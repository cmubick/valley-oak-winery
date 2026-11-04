import MailingList from './MailingList';

const button = 'inline-block rounded px-4 font-material text-sm font-medium leading-9 hover:bg-black/[.04]';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-vow-maroon bg-white">
      <div className="flex flex-col min-[960px]:flex-row">
        <div className="min-[960px]:basis-[36%]">
          <MailingList />
        </div>

        <div className="pt-[60px] font-black min-[960px]:basis-[25%] [&_p]:my-[1em]">
          <p>
            Valley Oak Winery
            <br />
            11809 E Belmont Ave
            <br />
            Sanger, CA 93657
          </p>
          <p>
            <a className={button} href="mailto:info@valleyoakwinery.com" target="_blank">
              info@valleyoakwinery.com
            </a>
            <br />
            559.940.6040
          </p>
          <p>
            Open Saturday and Sunday
            <br />
            noon to 5pm
            <br />
            or by appointment
          </p>
        </div>

        <div className="p-6 min-[960px]:basis-[39%]">
          <iframe
            title="Map to Valley Oak Winery"
            width={375}
            height={300}
            className="mx-auto max-w-full border-0"
            src="https://www.google.com/maps/embed/v1/place?q=place_id:ChIJf_dvk8NXlIARS0cS4yR2HtU&key=AIzaSyB1Zh6kaP3g4jS1EaUXDCvTlZOVBoVrRj0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex flex-col bg-vow-maroon text-white min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between">
        <div className="mx-8 my-1.5 text-left text-[80%]">
          <div>All rights reserved</div>
          <div>Valley Oak Winery, LLC &copy;</div>
        </div>
        <div className="my-1.5 mr-8 flex justify-end gap-16">
          <a className={button} href="https://instagram.com/valleyoakwinery" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a className={button} href="https://facebook.com/valleyoakwinery" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
}
