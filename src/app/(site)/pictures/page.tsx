import { Panel } from '@/components/site/SiteShell';
import { getLatestPosts } from '@/lib/instagram';

export const dynamic = 'force-dynamic'; // Instagram results are cached for an hour in lib/instagram

const INSTAGRAM_URL = 'https://www.instagram.com/valleyoakwinery/';

// Shown when Instagram can't be reached, so the page is never empty.
const FALLBACK_PHOTOS = [
  { src: '/images/tree.jpg', alt: 'The valley oak at the winery' },
  { src: '/images/dad-pouring-wine.jpg', alt: 'Pouring wine in the tasting room' },
  { src: '/images/vineyard-003.jpg', alt: 'Aerial view of the vineyard blocks' },
  { src: '/images/vineyards-001.jpg', alt: 'Vineyard rows at sunset' },
  { src: '/images/home.jpg', alt: 'The vineyard with the Sierra foothills behind' },
  { src: '/images/vineyard-002.jpg', alt: 'Vineyard and winery from above' },
];

const tile = 'group relative block aspect-square overflow-hidden bg-black/5';
const img = 'h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90';

export default async function PicturesPage() {
  const posts = await getLatestPosts(9);

  return (
    <Panel className="rounded-none bg-white/80">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts
          ? posts.map((post) => (
              <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className={tile}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URLs change; no optimization */}
                <img src={post.imageUrl} alt={post.caption?.slice(0, 120) ?? 'Instagram post'} loading="lazy" className={img} />
              </a>
            ))
          : FALLBACK_PHOTOS.map((photo) => (
              <a key={photo.src} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={tile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} loading="lazy" className={img} />
              </a>
            ))}
      </div>
      <p className="mt-4 text-center">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          Follow @valleyoakwinery on Instagram
        </a>
      </p>
    </Panel>
  );
}
