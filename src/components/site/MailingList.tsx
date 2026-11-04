// Mailchimp embedded signup form, copied from the original site. It posts straight to
// Mailchimp and opens the confirmation in a new tab.
export default function MailingList() {
  return (
    <div className="p-6 text-center min-[400px]:min-w-[350px]">
      <link
        rel="stylesheet"
        href="https://cdn-images.mailchimp.com/embedcode/classic-10_7.css"
        precedence="default"
      />
      <div className="text-[80%] italic opacity-70">Stay up to date with Valley Oak Winery and</div>
      <div className="text-[80%] italic opacity-70">UBICK Vineyards news and events</div>
      <div className="font-black">Please signup for our mailing list</div>

      <div id="mc_embed_signup">
        <form
          action="https://valleyoakwinery.us16.list-manage.com/subscribe/post?u=d99b503085655b3d8b383c3e5&amp;id=f6be917c19"
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate"
          target="_blank"
          noValidate
        >
          <div id="mc_embed_signup_scroll">
            <div className="indicates-required">
              <span className="asterisk">*</span> indicates required
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-EMAIL">
                Email Address <span className="asterisk">*</span>
              </label>
              <input type="email" defaultValue="" name="EMAIL" className="required email" id="mce-EMAIL" />
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-FNAME">First Name </label>
              <input type="text" defaultValue="" name="FNAME" id="mce-FNAME" />
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-LNAME">Last Name </label>
              <input type="text" defaultValue="" name="LNAME" id="mce-LNAME" />
            </div>
            <div id="mce-responses" className="clear">
              <div className="response" id="mce-error-response" style={{ display: 'none' }} />
              <div className="response" id="mce-success-response" style={{ display: 'none' }} />
            </div>
            {/* real people should not fill this in and expect good things - do not remove this or risk form bot signups */}
            <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
              <input type="text" name="b_d99b503085655b3d8b383c3e5_f6be917c19" tabIndex={-1} defaultValue="" />
            </div>
            <div className="clear">
              <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" className="button" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
