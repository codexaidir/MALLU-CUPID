import { LegalPageLayout } from "../components/LegalPageLayout";

export default function ContactUsPage() {
  return (
    <LegalPageLayout
      title="Contact Us"
      intro="We are here to help with account questions, payments, content issues, and general support."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Company Details</h2>
        <ul className="space-y-2 text-zinc-700">
          <li><strong>Company Name:</strong> MALLU CUPID</li>
          <li><strong>Email:</strong> info@mallucupid.com</li>
          <li><strong>Mobile:</strong> +91 9746109569</li>
          <li><strong>Address:</strong> 46/A1, Aluva, Ernakulam, Kerala, India</li>
          <li><strong>App Use:</strong> Content selling platform for digital works, e-books, and related digital products.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Razorpay Acceptance Details</h2>
        <p>MalluCupid accepts payments through Razorpay for purchases made on the platform. The merchant details displayed here are used for support, transaction inquiries, and compliance communication.</p>
      </section>
    </LegalPageLayout>
  );
}
