export const imageUrl = (id, width = 500) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export const products = [
  {
    id: 'galaxy-s22-ultra',
    name: 'Galaxy S22 Ultra',
    price: 32999,
    old: 74999,
    save: '₹32,999',
    image: imageUrl('photo-1511707171634-5f897ff02aa9'),
    tag: '56% OFF',
    description:
      'A powerful Galaxy smartphone with a vivid display, pro-grade camera, and all-day battery life.',
    storage: '128 GB',
  },
  {
    id: 'galaxy-m13',
    name: 'Galaxy M13 (4GB | 64 GB)',
    price: 10499,
    old: 14999,
    save: '₹4500',
    image: imageUrl('photo-1598327105666-5b89351aff97'),
    tag: '56% OFF',
    description:
      'Enjoy smooth everyday performance, a large screen, and dependable battery life with Galaxy M13.',
    storage: '64 GB',
  },
  {
    id: 'galaxy-m33',
    name: 'Galaxy M33 (4GB | 64 GB)',
    price: 16999,
    old: 24999,
    save: '₹8000',
    image: imageUrl('photo-1592899677977-9c10ca588bbd'),
    tag: '56% OFF',
    description:
      'A versatile smartphone for streaming, photography, and staying connected throughout the day.',
    storage: '64 GB',
  },
  {
    id: 'galaxy-m53',
    name: 'Galaxy M53 (4GB | 64 GB)',
    price: 31999,
    old: 40999,
    save: '₹9000',
    image: imageUrl('photo-1598327105666-5b89351aff97'),
    tag: '56% OFF',
    description:
      'Capture more detail and enjoy a responsive display with this feature-packed Galaxy phone.',
    storage: '64 GB',
  },
  {
    id: 'galaxy-s22-ultra-256gb',
    name: 'Galaxy S22 Ultra (256 GB)',
    price: 67999,
    old: 85999,
    save: '₹18000',
    image: imageUrl('photo-1598327105666-5b89351aff97'),
    tag: '56% OFF',
    description:
      'Get extra room for photos, apps, and files with the high-storage Galaxy S22 Ultra.',
    storage: '256 GB',
  },
];

export const categories = [
  ['Mobile', 'photo-1511707171634-5f897ff02aa9'],
  ['Cosmetics', 'photo-1608248543803-ba4f8c70ae0b'],
  ['Electronics', 'photo-1523275335684-37898b6baf30'],
  ['Furniture', 'photo-1567538096630-e0c55bd6374c'],
  ['Watches', 'photo-1523275335684-37898b6baf30'],
  ['Decor', 'photo-1490312278390-ab64016e0aa9'],
  ['Accessories', 'photo-1611652022419-a9419f74343d'],
];

export const brands = [
  {
    name: 'IPHONE',
    brand: 'Apple',
    tone: 'dark',
    photo: 'photo-1592750475338-74b7b21085ab',
  },
  {
    name: 'REALME',
    brand: 'realme',
    tone: 'yellow',
    photo: 'photo-1598327105666-5b89351aff97',
  },
  {
    name: 'XIAOMI',
    brand: 'mi',
    tone: 'peach',
    photo: 'photo-1592899677977-9c10ca588bbd',
  },
];

export const essentials = [
  ['Daily Essentials', 'photo-1542838132-92c53300491e'],
  ['Vegetables', 'photo-1540420773420-3366772f4999'],
  ['Fruits', 'photo-1610832958506-aa56368176cf'],
  ['Strawberry', 'photo-1464965911861-746a04b4bca6'],
  ['Mango', 'photo-1553279768-865429fa0078'],
  ['Cherry', 'photo-1528825871115-3581a5387919'],
];

export const popularCategories = [
  'Staples',
  'Beverages',
  'Personal Care',
  'Home Care',
  'Baby Care',
  'Vegetables & Fruits',
  'Snacks & Foods',
  'Dairy & Bakery',
];

export const customerServices = [
  'About Us',
  'Terms & Conditions',
  'FAQ',
  'Privacy Policy',
  'E-waste Policy',
  'Cancellation & Return Policy',
];
