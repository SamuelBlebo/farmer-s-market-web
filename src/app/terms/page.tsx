import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_NAME, SUPPORT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      <p className="eyebrow">Legal</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mb-6 text-[13px] text-muted">Last updated August 2026.</p>

      <div className="card space-y-5 p-5 text-[15px] leading-relaxed text-muted">
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">What {PLATFORM_NAME} is</h2>
          <p>
            {PLATFORM_NAME} is a listing platform that connects farmers in Ghana with buyers looking for produce.
            We show what farmers have to sell and let buyers reach them directly on WhatsApp or by phone.
            We are not a party to any sale — we do not handle payment, delivery, or fulfilment between a buyer
            and a farmer, and we make no guarantee about the quality, quantity, price, or availability of
            anything listed.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Your account</h2>
          <p>
            You must provide accurate information when you register and keep it up to date. You&apos;re
            responsible for anything that happens under your account, including your WhatsApp number and phone
            number being shown publicly on your listings or requests so the other party can contact you — don&apos;t
            register with contact details that aren&apos;t yours. Accounts are for individuals and businesses
            operating in good faith; we may suspend or remove an account that violates these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Listings and requests</h2>
          <p>
            Every new listing and buyer request is reviewed before it appears publicly, but review is a basic
            check, not a guarantee of accuracy. Farmers are responsible for the accuracy of what they post —
            price, quantity, photos, and description. Buyers are responsible for the accuracy of what they
            request. Report a listing that&apos;s inaccurate, fraudulent, or otherwise wrong using the report
            option on that listing.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Reviews</h2>
          <p>
            A review should reflect your own honest experience buying from that farmer. We review submissions
            before they go live and may reject or remove one that&apos;s fake, abusive, off-topic, or posted in bad
            faith. Leaving a review doesn&apos;t entitle you to compensation of any kind, and a farmer can&apos;t pay to
            have a review removed or added.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Prohibited use</h2>
          <p>
            Don&apos;t use {PLATFORM_NAME} to post anything illegal, misleading, or harmful; to harass another
            user; to scrape or misuse the platform; or to attempt to bypass the moderation or contact process.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Disclaimer and liability</h2>
          <p>
            {PLATFORM_NAME} is provided &quot;as is.&quot; We do our best to keep listings accurate and the platform
            running, but we&apos;re not liable for losses arising from a transaction between a buyer and a farmer,
            from produce quality or delivery, or from downtime or errors on the platform, to the fullest extent
            the law allows.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Changes</h2>
          <p>
            We may update these terms as the platform changes. Continuing to use {PLATFORM_NAME} after a change
            means you accept the update.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Contact</h2>
          <p>
            Questions about these terms — reach us via <Link href="/support" className="font-semibold text-leaf-dark hover:underline">Support</Link> or{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-leaf-dark hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
