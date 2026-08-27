import type { Metadata } from 'next';
import { ChatIcon, MailIcon } from '@/components/icons';
import { ReportProblemForm } from '@/components/report-problem-form';
import { SectionCard } from '@/components/section-card';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { PLATFORM_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/lib/constants';
import { whatsappSupportLink } from '@/lib/format';

export const metadata: Metadata = { title: 'Support' };

const FAQS = [
  {
    q: 'How do I post produce to sell?',
    a: `Register as a farmer, then post a listing from your dashboard. Every new listing is reviewed by an admin — usually the same day — before it appears on the marketplace.`,
  },
  {
    q: 'How do I buy something I see listed?',
    a: `Open the listing and tap Contact on WhatsApp, or call the farmer directly. ${PLATFORM_NAME} doesn't handle payment or delivery — you arrange those directly with the farmer.`,
  },
  {
    q: 'Why isn’t my listing showing on the marketplace yet?',
    a: `New listings queue for admin approval first. Check "Awaiting approval" on your dashboard — once approved, it appears on the marketplace immediately.`,
  },
  {
    q: 'What does the verified badge mean?',
    a: `A verified farmer's identity has been confirmed by an admin. It's a trust signal for buyers — it doesn't affect where or how a listing appears.`,
  },
  {
    q: 'I can’t find produce I need — what can I do?',
    a: `Post a "Wanted" request describing what you need. Farmers who can supply it will contact you directly on WhatsApp.`,
  },
  {
    q: 'How do I report a listing or a problem?',
    a: `Use "Report" on the listing itself for a specific listing issue, or the form below for anything else — a bug, a suggestion, or a general problem.`,
  },
];

export default function SupportPage() {
  return (
    <>
      <p className="eyebrow">Support</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">We&apos;re here to help</h1>
      <p className="mb-5 text-[15px] text-muted">
        Questions about buying, selling, or your account — reach out any way that&apos;s easiest.
      </p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="card flex items-center gap-3 p-4 transition-colors hover:border-[#B9CCBD]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf-light text-leaf-dark" aria-hidden>
            <MailIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold">Email us</span>
            <span className="block text-[13px] text-muted">{SUPPORT_EMAIL}</span>
          </span>
        </a>

        {SUPPORT_WHATSAPP ? (
          <WhatsAppButton href={whatsappSupportLink(SUPPORT_WHATSAPP)} label="Chat on WhatsApp" className="!justify-start !py-4" />
        ) : (
          <div className="card flex items-center gap-3 p-4 text-muted">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper" aria-hidden>
              <ChatIcon className="h-5 w-5" />
            </span>
            <span className="text-[13px]">WhatsApp support isn&apos;t set up yet — email us instead.</span>
          </div>
        )}
      </div>

      <div className="mb-5">
        <SectionCard title="Frequently asked questions">
          <div className="divide-y divide-line">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-bold marker:content-none">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-[13.5px] text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </SectionCard>
      </div>

      <h2 className="mb-2 text-lg font-semibold tracking-tight">Report a problem</h2>
      <ReportProblemForm />
    </>
  );
}
