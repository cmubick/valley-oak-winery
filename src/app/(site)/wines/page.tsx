import Image from 'next/image';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from '@/lib/dynamodb';
import {
  WINE_COLLECTIONS,
  WINE_STYLES,
  Wine,
  formatPrice,
  normalizeWine,
  sortWines,
  wineTitle,
} from '@/lib/wines';

export const dynamic = 'force-dynamic'; // always read fresh wines

async function getWines(): Promise<Wine[]> {
  const result = await dynamodb.send(new ScanCommand({ TableName: process.env.DYNAMODB_WINES_TABLE }));
  return sortWines((result.Items ?? []).map(normalizeWine));
}

function WineRow({ wine }: { wine: Wine }) {
  return (
    // Phones: label image centered above the wine. Wider screens: image beside it, level with the text.
    <div className="flex flex-col items-center gap-4 px-4 pb-10 pt-4 sm:flex-row">
      {wine.imageUrl && (
        <Image
          src={wine.imageUrl}
          alt={wineTitle(wine)}
          width={192}
          height={192}
          className="h-auto max-h-96 w-48 shrink-0 object-contain sm:max-h-48 sm:w-24"
        />
      )}
      <div className="w-full flex-1">
        <div className="flex justify-between gap-4 font-semibold">
          <div className="text-left">{wineTitle(wine)}</div>
          <div>{wine.award}</div>
          <div className="text-right">{wine.inStock ? formatPrice(wine.price) : 'Sold Out'}</div>
        </div>
        <div className="text-left italic">{wine.description}</div>
      </div>
    </div>
  );
}

export default async function WinesPage() {
  const wines = await getWines();

  return (
    <div className="mx-auto my-8 box-content max-w-[800px] bg-white p-2 md:p-8">
      {wines.length === 0 && <p className="py-8 italic">Our wine list is being updated. Please check back soon.</p>}

      {WINE_COLLECTIONS.map((collection) => {
        const inCollection = wines.filter((w) => w.collection === collection.id);
        if (inCollection.length === 0) return null;
        const styles = WINE_STYLES.filter((s) => inCollection.some((w) => w.style === s.id));
        // Only split into sub-headings when a collection has more than one style (as on the original site).
        const showStyleHeaders = styles.length > 1;

        return (
          <section key={collection.id}>
            <div className="text-[22px] font-semibold">{collection.title}</div>
            <div className="mt-1 italic">{collection.description}</div>
            {styles.map((style) => (
              <div key={style.id}>
                {showStyleHeaders && (
                  <div className="mt-3 text-[15px] font-semibold italic underline">{style.title}</div>
                )}
                {inCollection
                  .filter((w) => w.style === style.id)
                  .map((wine) => (
                    <WineRow key={wine.id} wine={wine} />
                  ))}
              </div>
            ))}
          </section>
        );
      })}

      <div className="text-center text-[11px] italic">
        Glass of Wine $10 | Charcuterie Small Plate $15 | Wine Tasting $20 per person. Wine tasting charge may be
        waived with purchase 1 bottle per person.
      </div>
    </div>
  );
}
