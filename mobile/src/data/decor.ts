/**
 * Brand decoration only (hero background imagery + category tiles).
 * NOT app data — real treatments/appointments come from the n8n API.
 */
const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=70`;

export const heroImage = img('photo-1570172619644-dfd03ed5d881');
export const featuredImage = img('photo-1512290923902-8a9f81dc236c');
export const welcomeImage = img('photo-1556228720-195a672e8a03');

/** Fallback image for a treatment card when the record has no image_url. */
export const procedurePlaceholder = img('photo-1598440947619-2c35fc9aa908');

/** Category chips shown on the Treatments screen (visual grouping only). */
export const categoryTiles = [
  { key: 'Facials', image: img('photo-1556228578-8c89e6adf883') },
  { key: 'Injectables', image: img('photo-1612349317150-e413f6a5b16d') },
  { key: 'Laser', image: img('photo-1576091160550-2173dba999ef') },
  { key: 'Skin Care', image: img('photo-1620916566398-39f1143ab7be') },
];
