'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export const NAV_LINKS = [
  { href: '/', label: 'Our Story' },
  { href: '/wines', label: 'Wines' },
  { href: '/wine-club', label: 'Wine Club' },
  { href: '/pictures', label: 'Pictures' },
];

const navLink = 'rounded px-4 text-base font-medium leading-9 hover:bg-black/[.04]';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="relative z-30 flex h-[75px] items-center border-b border-black bg-white px-4 text-black sm:px-8">
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/[.04] min-[960px]:hidden"
        >
          <Menu size={24} />
        </button>
        <Image src="/images/ValleyOak_Logo_tree_only.svg" alt="" width={50} height={50} className="h-[50px] w-[50px] shrink-0" priority />
        <Link
          href="/"
          onClick={close}
          className="rounded px-4 font-origins text-[22px] leading-tight hover:bg-black/[.04] sm:text-[30px] sm:leading-9"
        >
          Valley Oak Winery
        </Link>
        <span className="flex-1" />
        <nav className="hidden min-[960px]:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={navLink}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile drawer, like the original mat-sidenav in "over" mode */}
      {open && (
        <div className="fixed inset-0 top-[75px] z-20 bg-black/60 min-[960px]:hidden" onClick={close} aria-hidden />
      )}
      <nav
        className={`fixed bottom-0 left-0 top-[75px] z-20 flex flex-col bg-white py-2 shadow-xl transition-transform duration-200 min-[960px]:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} className={navLink} tabIndex={open ? 0 : -1}>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
