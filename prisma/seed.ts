import { PrismaClient, type FarmerProfile, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES } from '../src/lib/constants';
import { normalizeGhanaPhone } from '../src/lib/format';

const prisma = new PrismaClient();

const PASSWORD = 'password123';

type FarmerSeed = {
  farm: string; person: string; email: string; region: string; town: string;
  phone: string; verification: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'; desc: string;
};

const FARMERS: FarmerSeed[] = [
  { farm: 'Kofi Mensah Farms', person: 'Kofi Mensah', email: 'kofi@farmersmarket.gh', region: 'Bono East', town: 'Techiman', phone: '0244101234', verification: 'VERIFIED', desc: 'Family farm on 12 acres. Tomatoes, pepper and garden eggs, harvested twice weekly.' },
  { farm: 'Adwoa Agyeman Farms', person: 'Adwoa Agyeman', email: 'adwoa@farmersmarket.gh', region: 'Ashanti', town: 'Ejura', phone: '0201445566', verification: 'VERIFIED', desc: 'Maize and cowpea in bulk. We bag on site and load directly onto trucks.' },
  { farm: 'Nkrumah Poultry', person: 'Yaw Nkrumah', email: 'yaw@farmersmarket.gh', region: 'Bono', town: 'Dormaa Ahenkro', phone: '0559887744', verification: 'VERIFIED', desc: 'Layer and broiler farm. Crates of eggs available daily.' },
  { farm: 'Yaa Boateng Farms', person: 'Yaa Boateng', email: 'yaa@farmersmarket.gh', region: 'Bono', town: 'Wenchi', phone: '0246778899', verification: 'PENDING', desc: 'Yam and cassava grower supplying Techiman market.' },
  { farm: 'Salifu Abdulai Farms', person: 'Salifu Abdulai', email: 'salifu@farmersmarket.gh', region: 'Northern', town: 'Tamale', phone: '0208112233', verification: 'VERIFIED', desc: 'Groundnuts, onions and dry-season vegetables.' },
  { farm: 'Ama Serwaa Gardens', person: 'Ama Serwaa', email: 'ama@farmersmarket.gh', region: 'Eastern', town: 'Aburi', phone: '0277334455', verification: 'UNVERIFIED', desc: 'Small garden farm — okro, garden eggs, pepper.' },
  { farm: 'Tetteh Family Farm', person: 'Nii Tetteh', email: 'nii@farmersmarket.gh', region: 'Eastern', town: 'Somanya', phone: '0244556677', verification: 'VERIFIED', desc: 'Mango and pineapple orchard, 20 acres.' },
  { farm: 'Bawku Grain Store', person: 'Musah Awuni', email: 'musah@farmersmarket.gh', region: 'Upper East', town: 'Bawku', phone: '0209001122', verification: 'VERIFIED', desc: 'Maize, beans and soya in bags and tonnes.' },
  { farm: 'Osei Farms', person: 'Kwabena Osei', email: 'kwabena@farmersmarket.gh', region: 'Bono East', town: 'Kintampo', phone: '0553221100', verification: 'UNVERIFIED', desc: 'Plantain and cassava, harvested to order.' },
  { farm: 'Nsawam Fruit Growers', person: 'Esi Larbi', email: 'esi@farmersmarket.gh', region: 'Eastern', town: 'Nsawam', phone: '0242998877', verification: 'VERIFIED', desc: 'Sugarloaf pineapple, cut fresh for wholesale buyers.' },
];

type BuyerSeed = { business: string; person: string; email: string; region: string; town: string; phone: string; desc: string };

const BUYERS: BuyerSeed[] = [
  { business: 'Mensah Foods Ltd', person: 'Eric Mensah', email: 'eric@mensahfoods.gh', region: 'Greater Accra', town: 'Madina', phone: '0244778811', desc: 'Wholesale supplier to Madina and Adenta markets.' },
  { business: 'Ashanti Feedmill', person: 'Grace Owusu', email: 'grace@ashantifeed.gh', region: 'Ashanti', town: 'Kumasi', phone: '0205544332', desc: 'Poultry feed manufacturer. Buys maize and soya weekly.' },
  { business: 'Coastal Fresh Distributors', person: 'Kojo Arthur', email: 'kojo@coastalfresh.gh', region: 'Western', town: 'Takoradi', phone: '0556677889', desc: 'Fresh produce distribution across the Western region.' },
  { business: "Kelly's Bakery", person: 'Akosua Kelly', email: 'akosua@kellysbakery.gh', region: 'Greater Accra', town: 'Tema', phone: '0277889900', desc: 'Bakery buying eggs and flour inputs twice monthly.' },
  { business: 'Makola Traders Co-op', person: 'Hajia Fati', email: 'fati@makolatraders.gh', region: 'Greater Accra', town: 'Accra', phone: '0243311220', desc: 'Trader co-operative sourcing vegetables for Makola market.' },
  { business: 'Northern Star Processing', person: 'Iddrisu Bawa', email: 'iddrisu@northernstar.gh', region: 'Northern', town: 'Tamale', phone: '0208877665', desc: 'Groundnut paste and shea processing.' },
];

// [name, categorySlug, price in cedis, unit, quantity, initialQty, farmerIndex, status]
type P = [string, string, number, string, number, number, number, 'ACTIVE' | 'PAUSED' | 'SOLD', string];

const PRODUCTS: P[] = [
  ['Fresh Tomatoes', 'vegetables', 12, 'kg', 500, 800, 0, 'ACTIVE', 'Freshly harvested Roma tomatoes, firm and market-ready. Harvested Tuesday and Friday.'],
  ['Kpakpo Shito Pepper', 'vegetables', 22, 'kg', 150, 200, 0, 'ACTIVE', 'Aromatic kpakpo shito, hand-picked. Sold in 25kg baskets.'],
  ['Garden Eggs', 'vegetables', 14, 'kg', 320, 400, 0, 'ACTIVE', 'Small white garden eggs, tender and fresh.'],
  ['Cabbage', 'vegetables', 9, 'kg', 260, 300, 0, 'ACTIVE', 'Firm cabbage heads, cut to order.'],
  ['White Maize (dry)', 'grains', 520, '100kg bag', 180, 250, 1, 'ACTIVE', 'Well-dried white maize, moisture below 13%. Bagged on site.'],
  ['Cowpea Beans (white)', 'legumes', 780, '100kg bag', 95, 120, 1, 'ACTIVE', 'White cowpea, well dried and hand-sorted.'],
  ['Yellow Maize', 'grains', 495, '100kg bag', 140, 200, 1, 'ACTIVE', 'Yellow maize suitable for feed milling.'],
  ['Crate of Eggs (medium)', 'eggs', 62, 'crate', 340, 400, 2, 'ACTIVE', 'Fresh medium-size eggs, 30 per crate. Collected daily.'],
  ['Crate of Eggs (large)', 'eggs', 74, 'crate', 180, 250, 2, 'ACTIVE', 'Large eggs from our older layer house.'],
  ['Live Broiler Chicken', 'poultry', 75, 'bird', 900, 1200, 2, 'ACTIVE', 'Broilers at 2.2kg average live weight. Minimum 50 birds.'],
  ['Spent Layers', 'poultry', 48, 'bird', 300, 500, 2, 'ACTIVE', 'End-of-lay hens, healthy and well fed.'],
  ['Puna Yam (large tubers)', 'tubers', 280, '100 tubers', 1400, 2000, 3, 'ACTIVE', 'Clean Puna yam, sorted large. Loaded at the farm gate.'],
  ['Water Yam', 'tubers', 195, '100 tubers', 600, 900, 3, 'ACTIVE', 'Water yam in good condition, freshly harvested.'],
  ['Cassava (fresh)', 'tubers', 340, 'tonne', 14, 20, 3, 'ACTIVE', 'Fresh cassava roots, uprooted to order to avoid spoilage.'],
  ['Groundnuts (shelled)', 'legumes', 640, '100kg bag', 60, 90, 4, 'ACTIVE', 'Shelled and sorted groundnuts, dry and clean.'],
  ['Onions (red)', 'vegetables', 420, '100kg bag', 70, 100, 4, 'ACTIVE', 'Red onions cured and bagged. Stored dry, low spoilage.'],
  ['Dry Pepper', 'vegetables', 38, 'kg', 240, 300, 4, 'ACTIVE', 'Sun-dried pepper, milled or whole.'],
  ['Bambara Beans', 'legumes', 810, '100kg bag', 40, 60, 4, 'ACTIVE', 'Traditional bambara beans, cleaned and bagged.'],
  ['Okro (fresh)', 'vegetables', 16, 'kg', 120, 160, 5, 'PAUSED', 'Tender okro, picked young. Paused between harvests.'],
  ['Sweet Pepper', 'vegetables', 26, 'kg', 90, 120, 5, 'ACTIVE', 'Green and red sweet pepper from the garden.'],
  ['Lettuce', 'vegetables', 18, 'kg', 60, 80, 5, 'ACTIVE', 'Crisp lettuce, cut the morning of collection.'],
  ['Keitt Mango', 'fruits', 9, 'kg', 1800, 2500, 6, 'ACTIVE', 'Large Keitt mango picked at colour break.'],
  ['Sugarloaf Pineapple', 'fruits', 6, 'piece', 2200, 3000, 9, 'ACTIVE', 'Sweet sugarloaf pineapple, field-ripened. Minimum order 200 pieces.'],
  ['MD2 Pineapple', 'fruits', 8, 'piece', 1500, 2000, 9, 'ACTIVE', 'MD2 variety for export-grade buyers.'],
  ['Pawpaw', 'fruits', 7, 'kg', 700, 900, 6, 'ACTIVE', 'Solo pawpaw, firm and sweet.'],
  ['Watermelon', 'fruits', 5, 'kg', 1200, 1500, 6, 'ACTIVE', 'Sweet watermelon, harvested to order.'],
  ['Soya Beans', 'legumes', 690, '100kg bag', 0, 150, 7, 'SOLD', 'Clean soya beans — this lot has been sold.'],
  ['Millet', 'grains', 580, '100kg bag', 85, 120, 7, 'ACTIVE', 'Dry millet, threshed and winnowed.'],
  ['Sorghum', 'grains', 540, '100kg bag', 110, 150, 7, 'ACTIVE', 'Red sorghum for brewing and feed.'],
  ['Rice Paddy', 'grains', 610, '100kg bag', 200, 260, 7, 'ACTIVE', 'Locally grown paddy rice, ready for milling.'],
  ['Apem Plantain', 'tubers', 130, 'bunch', 220, 300, 8, 'ACTIVE', 'Medium-to-large apem plantain, cut on the day of pickup.'],
  ['Apantu Plantain', 'tubers', 160, 'bunch', 140, 200, 8, 'ACTIVE', 'Large apantu plantain for wholesale.'],
  ['Cocoyam', 'tubers', 240, 'tonne', 9, 15, 8, 'ACTIVE', 'Fresh cocoyam, sorted and bagged.'],
  ['Cassava Sticks (planting)', 'other', 120, 'box', 50, 80, 8, 'ACTIVE', 'Improved cassava planting material.'],
];

// Local dev placeholder photos — see public/seed/. Never fabricated remote
// URLs; these are hand-authored SVGs we fully control.
const SPECIFIC_IMAGES: Record<string, string> = {
  tomato: '/seed/tomato.svg',
  yam: '/seed/yam.svg',
  cassava: '/seed/cassava.svg',
  maize: '/seed/maize.svg',
  pepper: '/seed/pepper.svg',
  shito: '/seed/pepper.svg',
  onion: '/seed/onion.svg',
  plantain: '/seed/plantain.svg',
};
const CATEGORY_IMAGES: Record<string, string> = {
  vegetables: '/seed/category-vegetables.svg',
  fruits: '/seed/category-fruits.svg',
  grains: '/seed/category-grains.svg',
  tubers: '/seed/category-tubers.svg',
  legumes: '/seed/category-legumes.svg',
  poultry: '/seed/category-poultry.svg',
  livestock: '/seed/category-livestock.svg',
  eggs: '/seed/category-eggs.svg',
  other: '/seed/category-other.svg',
};

/** A specific match plus its category fallback when they differ — gives most
 * products two photos so the gallery UI has something real to show in dev. */
function imagesFor(name: string, categorySlug: string): string[] {
  const lower = name.toLowerCase();
  const specificKey = Object.keys(SPECIFIC_IMAGES).find((k) => lower.includes(k));
  const category = CATEGORY_IMAGES[categorySlug] ?? CATEGORY_IMAGES.other;
  if (!specificKey) return [category];
  const specific = SPECIFIC_IMAGES[specificKey];
  return specific === category ? [specific] : [specific, category];
}

const WANTED = [
  { buyer: 0, productName: 'Puna Yam', quantity: '2 tonnes', region: 'Greater Accra', town: 'Accra', days: 18, description: 'Looking for good-quality yam for wholesale in Madina market. Can collect.' },
  { buyer: 1, productName: 'White Maize', quantity: '400 bags', region: 'Ashanti', town: 'Kumasi', days: 33, description: 'Dry maize, moisture below 13.5%. Weekly supply preferred over one-off.' },
  { buyer: 2, productName: 'Tomatoes', quantity: '300 crates weekly', region: 'Western', town: 'Takoradi', days: null, description: 'Standing weekly order for firm tomatoes. Own transport available.' },
  { buyer: 3, productName: 'Crates of Eggs', quantity: '200 crates', region: 'Greater Accra', town: 'Tema', days: 13, description: 'Medium eggs for bakery use, twice monthly.' },
  { buyer: 4, productName: 'Onions', quantity: '80 bags', region: 'Greater Accra', town: 'Accra', days: 21, description: 'Red onions for Makola traders. Paying on collection.' },
  { buyer: 5, productName: 'Groundnuts', quantity: '5 tonnes', region: 'Northern', town: 'Tamale', days: 40, description: 'Shelled groundnuts for paste production. Regular supply wanted.' },
];

async function main() {
  console.log('Clearing existing data…');
  await prisma.report.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.wantedListing.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log('Categories…');
  const categories = await Promise.all(
    CATEGORIES.map((c, i) =>
      prisma.category.create({ data: { name: c.name, slug: c.slug, emoji: c.emoji, sortOrder: i } }),
    ),
  );
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  console.log('Admin…');
  await prisma.user.create({
    data: { email: 'admin@farmersmarket.gh', name: 'Platform Admin', role: 'ADMIN', passwordHash, phone: normalizeGhanaPhone('0302000000') },
  });

  console.log('Farmers…');
  const farmerProfiles: FarmerProfile[] = [];
  for (const f of FARMERS) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        name: f.person,
        phone: normalizeGhanaPhone(f.phone),
        role: 'FARMER',
        passwordHash,
        farmerProfile: {
          create: {
            farmName: f.farm,
            description: f.desc,
            region: f.region,
            town: f.town,
            phone: f.phone,
            whatsapp: f.phone,
            verification: f.verification,
            verifiedAt: f.verification === 'VERIFIED' ? new Date() : null,
          },
        },
      },
      include: { farmerProfile: true },
    });
    farmerProfiles.push(user.farmerProfile!);
  }

  console.log('Buyers…');
  const buyerProfiles = [];
  for (const b of BUYERS) {
    const user = await prisma.user.create({
      data: {
        email: b.email,
        name: b.person,
        phone: normalizeGhanaPhone(b.phone),
        role: 'BUYER',
        passwordHash,
        buyerProfile: {
          create: {
            businessName: b.business,
            description: b.desc,
            region: b.region,
            town: b.town,
            phone: b.phone,
            whatsapp: b.phone,
          },
        },
      },
      include: { buyerProfile: true },
    });
    buyerProfiles.push(user.buyerProfile!);
  }

  console.log('Products…');
  const products: Prisma.ProductCreateManyInput[] = PRODUCTS.map(
    ([name, slug, price, unit, qty, initial, farmerIdx, status, desc], i) => {
      const farmer = farmerProfiles[farmerIdx];
      return {
        name,
        description: desc,
        categoryId: catBySlug.get(slug)!,
        farmerId: farmer.id,
        priceMinor: Math.round(price * 100),
        unit,
        quantity: qty,
        initialQty: initial,
        region: farmer.region,
        town: farmer.town,
        status,
        // Most seeded listings are already live; the last three sit in the admin queue.
        moderation: i >= PRODUCTS.length - 3 ? 'PENDING' : 'APPROVED',
        createdAt: new Date(Date.now() - i * 7 * 3_600_000),
      };
    },
  );
  await prisma.product.createMany({ data: products });

  console.log('Product photos…');
  const createdProducts = await prisma.product.findMany({ select: { id: true, name: true, categoryId: true } });
  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));
  const imageRows: Prisma.ProductImageCreateManyInput[] = createdProducts.flatMap((p) => {
    const slug = categorySlugById.get(p.categoryId) ?? 'other';
    return imagesFor(p.name, slug).map((url, i) => ({
      productId: p.id,
      url,
      publicId: `local:${url}`,
      sortOrder: i,
    }));
  });
  await prisma.productImage.createMany({ data: imageRows });

  console.log('Wanted listings…');
  for (const [i, w] of WANTED.entries()) {
    await prisma.wantedListing.create({
      data: {
        buyerId: buyerProfiles[w.buyer].id,
        productName: w.productName,
        quantity: w.quantity,
        region: w.region,
        town: w.town,
        neededBy: w.days ? new Date(Date.now() + w.days * 86_400_000) : null,
        description: w.description,
        // Most seeded requests are already live; the last two sit in the admin queue.
        moderation: i >= WANTED.length - 2 ? 'PENDING' : 'APPROVED',
      },
    });
  }

  console.log('Reports…');
  const reported = await prisma.product.findMany({ take: 2, where: { status: 'ACTIVE' } });
  const reporter = await prisma.user.findFirstOrThrow({ where: { role: 'BUYER' } });
  for (const p of reported) {
    await prisma.report.create({
      data: {
        productId: p.id,
        reporterId: reporter.id,
        reason: 'Price looks wrong',
        details: 'Listed per tonne but the farmer says per bag.',
      },
    });
  }

  const counts = {
    farmers: farmerProfiles.length,
    buyers: buyerProfiles.length,
    products: products.length,
    wanted: WANTED.length,
  };
  console.log('Seeded:', counts);
  console.log(`Every seeded account uses the password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
