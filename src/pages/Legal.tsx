import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

interface Section {
  heading: string;
  body: string[];
}

interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

/**
 * Template legal pages. These are professional starting points — NOT legal
 * advice. Have a healthcare-attorney review and finalize before launch.
 */
const DOCS: Record<"privacy" | "terms" | "hipaa", LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: July 9, 2026",
    intro:
      "PracticeVoice AI (“we”, “us”) provides an AI voice receptionist for healthcare and legal practices. This policy explains what we collect and how we use it.",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "Account information you provide (name, email, practice details).",
          "Call data processed on your behalf: caller phone numbers, call audio, transcripts, and appointment details.",
          "Usage data such as pages viewed and features used, to improve the product.",
        ],
      },
      {
        heading: "How we use information",
        body: [
          "To answer calls, book appointments, and send confirmations on your behalf.",
          "To provide analytics and revenue attribution in your dashboard.",
          "To secure, maintain, and improve the service.",
        ],
      },
      {
        heading: "Protected health information (PHI)",
        body: [
          "When you handle PHI through the service, we act as your business associate. A Business Associate Agreement (BAA) governs that relationship and is available on qualifying plans.",
          "PHI is encrypted in transit and at rest and is only accessible to authorized users of your practice.",
        ],
      },
      {
        heading: "Data sharing",
        body: [
          "We share data only with subprocessors required to run the service (e.g. voice, telephony, and cloud hosting providers), each under contractual data-protection obligations.",
          "We do not sell your data or your patients' data.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can access, export, or delete your practice's data from Settings or by contacting us.",
          "Contact practicevoiceai@yahoo.com with any privacy request.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "Last updated: July 9, 2026",
    intro:
      "These terms govern your use of PracticeVoice AI. By creating an account you agree to them.",
    sections: [
      {
        heading: "The service",
        body: [
          "PracticeVoice AI provides software that answers calls, schedules appointments, and sends messages on your behalf.",
          "You are responsible for the accuracy of the practice information, hours, and services you configure.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Use the service only for lawful purposes and in compliance with applicable healthcare and telecommunications regulations.",
          "You must obtain any consents required to record calls or send SMS messages in your jurisdiction.",
        ],
      },
      {
        heading: "Billing & trials",
        body: [
          "Paid plans are billed monthly. The 14-day free trial requires no credit card and can be cancelled anytime.",
          "Fees are non-refundable except where required by law.",
        ],
      },
      {
        heading: "Disclaimers",
        body: [
          "The service is provided “as is.” It assists with, but does not replace, professional clinical or legal judgment.",
          "It is not intended for medical emergencies. Emergency callers should be directed to appropriate emergency services.",
        ],
      },
      {
        heading: "Contact",
        body: ["Questions about these terms? Email practicevoiceai@yahoo.com."],
      },
    ],
  },
  hipaa: {
    title: "HIPAA & Security",
    updated: "Last updated: July 9, 2026",
    intro:
      "We build PracticeVoice AI to support HIPAA-conscious workflows for healthcare practices. This page summarizes our approach.",
    sections: [
      {
        heading: "Business Associate Agreement",
        body: [
          "For practices handling protected health information, we offer a Business Associate Agreement (BAA) on qualifying plans.",
          "The BAA defines our obligations to safeguard PHI you process through the service.",
        ],
      },
      {
        heading: "Encryption",
        body: [
          "Data is encrypted in transit (TLS) and at rest.",
          "Call recordings and transcripts are stored with access restricted to your authorized team.",
        ],
      },
      {
        heading: "Access controls",
        body: [
          "Row-level security ensures each practice can only access its own calls, appointments, and settings.",
          "Authentication is handled through a secure identity provider with password and session protections.",
        ],
      },
      {
        heading: "Your responsibilities",
        body: [
          "Keep account credentials secure and limit access to authorized staff.",
          "Configure call-recording consent language appropriate to your state and specialty.",
        ],
      },
      {
        heading: "Reporting a concern",
        body: [
          "Report a security concern to practicevoiceai@yahoo.com and we will respond promptly.",
        ],
      },
    ],
  },
};

export default function Legal({ doc }: { doc: keyof typeof DOCS }) {
  const content = DOCS[doc];
  useDocumentMeta({
    title: `${content.title} — PracticeVoice AI`,
    description: content.intro,
    path: `/${doc}`,
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <div className="container-page max-w-3xl py-14 lg:py-20">
          <Badge variant="neutral" className="mb-4">
            Legal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{content.updated}</p>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {content.intro}
          </p>

          <div className="mt-10 space-y-8">
            {content.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg font-semibold">{s.heading}</h2>
                <ul className="mt-3 space-y-2">
                  {s.body.map((p, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            This policy is provided for general information and may be updated
            from time to time. Questions? Email{" "}
            <a
              href="mailto:practicevoiceai@yahoo.com"
              className="font-medium text-primary hover:underline"
            >
              practicevoiceai@yahoo.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
