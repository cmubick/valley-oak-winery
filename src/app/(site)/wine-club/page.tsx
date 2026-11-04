const MEMBERSHIPS = [
  { name: 'Crush Pad Member', perks: ['4 bottles / 2 times per year', '10% discount'] },
  {
    name: 'Tasting Room Member',
    perks: ['6 bottles / 2 times per year', '20% discount', 'Access to Limited Edition wines'],
  },
  {
    name: 'Cellar Club Member',
    perks: ['12 bottles / 2 times per year', '25% discount', 'Access to Limited Edition wines', 'Special privileges/offerings'],
  },
  { name: 'Corporate Member', perks: ['(ask for details)'] },
];

export default function WineClubPage() {
  return (
    <div className="mx-4 my-6 bg-white/90 pb-[75px] text-left sm:mx-8">
      <div className="flex justify-center pb-2 pt-8 text-[22px] font-semibold">Wine Club</div>
      <div className="p-8">
        <div className="pb-[15px] italic">
          ~ Complimentary wine tasting
          <br />
          ~ Discount on Wines, Events, &amp; Logo gear
          <br />
          ~ First option on new release &amp; close outs
          <br />
          ~ Additional 2-5% discount on club pickups
        </div>
        {MEMBERSHIPS.map((m) => (
          <div key={m.name} className="pb-[15px]">
            <div className="flex items-center font-material text-base font-medium leading-6">
              {/* Unchecked checkbox, as on the original page (decorative only) */}
              <span className="mr-2 inline-block h-4 w-4 rounded-[2px] border-2 border-black/55" aria-hidden />
              {m.name}
            </div>
            <ul className="my-4 list-disc pl-10">
              {m.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="pb-[15px]">Wine club membership is available. Please call or visit the winery.</div>
      </div>
    </div>
  );
}
