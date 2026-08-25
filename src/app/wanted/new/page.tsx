import { WantedForm } from '@/components/wanted-form';
import { requireBuyerProfile } from '@/server/authz';

export default async function NewWantedPage() {
  const { profile } = await requireBuyerProfile();

  return (
    <div className="mx-auto max-w-[560px]">
      <p className="eyebrow">Tell farmers what you need</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Post a request</h1>
      <WantedForm defaultRegion={profile.region} defaultTown={profile.town} />
      <p className="mt-3 text-center text-[12.5px] text-muted">
        Farmers who can supply will message you on WhatsApp.
      </p>
    </div>
  );
}
