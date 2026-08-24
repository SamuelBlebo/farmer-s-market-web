'use client';

export function DeleteListingForm({
  productId,
  action,
}: {
  productId: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this listing? This cannot be undone.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button className="btn-ghost !px-3 !py-1.5 !text-[13px] !text-clay">Delete</button>
    </form>
  );
}
