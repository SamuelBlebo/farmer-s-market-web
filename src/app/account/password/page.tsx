import { ChangePasswordForm } from '@/components/change-password-form';
import { requireUser } from '@/server/authz';

export default async function AccountPasswordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-[440px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Change password</h1>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
