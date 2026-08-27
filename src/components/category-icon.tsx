import {
  CategoryEggIcon,
  CategoryFruitIcon,
  CategoryLegumeIcon,
  CategoryLivestockIcon,
  CategoryPoultryIcon,
  CategoryTuberIcon,
  CategoryVegetableIcon,
  LeafIcon,
  WheatIcon,
} from './icons';

const CATEGORY_ICON: Record<string, (props: { className?: string }) => JSX.Element> = {
  vegetables: CategoryVegetableIcon,
  fruits: CategoryFruitIcon,
  grains: WheatIcon,
  tubers: CategoryTuberIcon,
  legumes: CategoryLegumeIcon,
  poultry: CategoryPoultryIcon,
  livestock: CategoryLivestockIcon,
  eggs: CategoryEggIcon,
  other: LeafIcon,
};

/** Maps a category's slug to a line-art icon. Unknown/custom admin-added categories fall back to a plain leaf. */
export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = CATEGORY_ICON[slug] ?? LeafIcon;
  return <Icon className={className} />;
}
