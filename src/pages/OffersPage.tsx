import type { OfferProduct } from '../types';
import { getCurrentWeekRange, formatDateRange } from '../utils/week';

interface OffersPageProps {
  offers: OfferProduct[];
}

export function OffersPage({ offers }: OffersPageProps) {
  const { start, end } = getCurrentWeekRange();
  const byCategory = new Map<string, OfferProduct[]>();
  for (const offer of offers) {
    const list = byCategory.get(offer.category) ?? [];
    list.push(offer);
    byCategory.set(offer.category, list);
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>This week's Jumbo offers</h1>
        <p className="page__subtitle">
          {formatDateRange(start, end)} — sample data for now, see note in the README.
        </p>
      </div>

      {[...byCategory.entries()].map(([category, products]) => (
        <section key={category} className="offer-section">
          <h2>{category}</h2>
          <div className="offer-grid">
            {products.map((offer) => (
              <div key={offer.id} className="offer-card">
                <div className="offer-card__emoji">{offer.imageEmoji}</div>
                <div className="offer-card__body">
                  <h3>{offer.name}</h3>
                  <p className="offer-card__unit">{offer.unit}</p>
                  <div className="offer-card__prices">
                    <span className="offer-card__old-price">€{offer.regularPrice.toFixed(2)}</span>
                    <span className="offer-card__new-price">€{offer.offerPrice.toFixed(2)}</span>
                    <span className="badge badge--offer">{offer.discountLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
