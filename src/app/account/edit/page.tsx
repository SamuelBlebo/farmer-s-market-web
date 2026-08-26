import { ProfileForm } from '@/components/profile-form';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireBuyerProfile, requireFarmerProfile, requireUser } from '@/server/authz';
import { updateAdminProfile, updateBuyerProfile, updateFarmerProfile } from '@/server/actions/account';

function Wrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[440px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export default async function AccountEditPage() {
  const sessionUser = await requireUser();

  if (sessionUser.role === 'FARMER') {
    const { user, profile } = await requireFarmerProfile();
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return (
      <Wrapper title="Edit profile">
        <ProfileForm
          role="FARMER"
          action={updateFarmerProfile}
          initial={{
            name: dbUser.name,
            phone: profile.phone,
            email: dbUser.email,
            image: dbUser.image,
            region: profile.region,
            town: profile.town,
            businessName: profile.farmName,
            coverImage: profile.coverImage,
            description: profile.description,
          }}
        />
      </Wrapper>
    );
  }

  if (sessionUser.role === 'BUYER') {
    const { user, profile } = await requireBuyerProfile();
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return (
      <Wrapper title="Edit profile">
        <ProfileForm
          role="BUYER"
          action={updateBuyerProfile}
          initial={{
            name: dbUser.name,
            phone: profile.phone,
            email: dbUser.email,
            image: dbUser.image,
            businessName: profile.businessName,
          }}
        />
      </Wrapper>
    );
  }

  const admin = await requireAdmin();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
  return (
    <Wrapper title="Edit account">
      <ProfileForm
        role="ADMIN"
        action={updateAdminProfile}
        initial={{ name: dbUser.name, phone: dbUser.phone, email: dbUser.email }}
      />
    </Wrapper>
  );
}
