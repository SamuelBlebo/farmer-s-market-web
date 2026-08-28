import { CheckIcon, ShieldIcon } from './icons';

type Tip = { title: string; description: string };

const BUYING_TIPS: Tip[] = [
  { title: 'Buy from verified farmers', description: 'Look for the Verified badge when available.' },
  { title: 'Call before travelling', description: 'Confirm the product is still available before making the trip.' },
  { title: 'Meet in a safe place', description: 'Choose a public or agreed pickup location when possible.' },
  { title: 'Inspect before paying', description: 'Check the produce quality and quantity before completing payment.' },
  {
    title: 'Be cautious of unusual requests',
    description: "Avoid sending money if you're unsure or pressured into paying in advance.",
  },
  { title: 'Report suspicious listings', description: "Use the Report button if something doesn't seem right." },
];

const SELLING_TIPS: Tip[] = [
  { title: 'Keep your listing accurate', description: 'Use real photos, prices, and harvest dates.' },
  { title: 'Confirm orders before harvesting', description: 'Speak with buyers before preparing large quantities.' },
  { title: 'Meet in safe locations', description: 'Choose secure pickup points when appropriate.' },
  { title: 'Protect your personal information', description: 'Share only the details needed to complete the sale.' },
  { title: 'Report abusive buyers', description: 'Let the admin team know if someone behaves suspiciously.' },
];

export function SafetyTips({ mode }: { mode: 'buying' | 'selling' }) {
  const tips = mode === 'buying' ? BUYING_TIPS : SELLING_TIPS;
  const heading = mode === 'buying' ? 'Stay Safe When Buying' : 'Stay Safe When Selling';

  return (
    <div className="card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-bold">
        <ShieldIcon className="h-4 w-4 text-leaf-dark" /> {heading}
      </p>
      <ul className="space-y-3">
        {tips.map((tip) => (
          <li key={tip.title} className="flex gap-2.5">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-leaf-dark" />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{tip.title}</p>
              <p className="text-[12.5px] text-muted">{tip.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
