import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_NAME, SUPPORT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      <p className="eyebrow">Legal</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mb-6 text-[13px] text-muted">Last updated August 2026.</p>

      <div className="card space-y-5 p-5 text-[15px] leading-relaxed text-muted">
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">What we collect</h2>
          <p>
            When you register: your name, phone number, and (optionally) email address. If you set up a farm or
            business profile: your region, town, WhatsApp number, and anything you write in a description or
            listing. If you upload a photo, it&apos;s sent straight from your browser to Cloudinary, our image
            host — it never passes through our servers. We also record ordinary usage — searches, page views,
            WhatsApp/call clicks — tied to your account if you&apos;re signed in, or anonymously if you&apos;re not.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">How we use it</h2>
          <p>
            To run the marketplace: show your listings or requests, let the other side contact you, review
            submissions before they go live, and show basic trust signals like a verified badge or trust score.
            Usage data helps us understand what&apos;s popular and fix what&apos;s broken. We don&apos;t sell your data,
            and we don&apos;t use it for third-party advertising.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">What&apos;s shown publicly</h2>
          <p>
            A farmer&apos;s listings, farm name, region/town, WhatsApp number, and phone number are public — that&apos;s
            how buyers reach you, since {PLATFORM_NAME} doesn&apos;t handle contact internally. A buyer&apos;s wanted
            requests and business name are public the same way. Your personal name and email are never shown
            publicly.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Who we share it with</h2>
          <p>
            Cloudinary stores photos you upload. Our hosting and database providers process data on our behalf
            to run the platform. We don&apos;t share your information with anyone else, except where required by
            law.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Cookies</h2>
          <p>
            We use a single session cookie to keep you signed in. No third-party ad or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Your choices</h2>
          <p>
            Edit your profile any time from your account settings. To delete your account or request a copy of
            your data, contact <Link href="/support" className="font-semibold text-leaf-dark hover:underline">Support</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Changes</h2>
          <p>We may update this policy as the platform changes; the date above reflects the latest version.</p>
        </section>

        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">Contact</h2>
          <p>
            Questions about this policy — reach us via <Link href="/support" className="font-semibold text-leaf-dark hover:underline">Support</Link> or{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-leaf-dark hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
