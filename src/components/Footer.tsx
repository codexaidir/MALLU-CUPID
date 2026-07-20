import { Heart, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const legalLinks = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Contact Us", to: "/contact-us" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white px-6 py-12 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          <span className="font-display text-lg font-bold text-zinc-900">
            MalluCupid
          </span>
        </div>

        <div className="flex flex-col gap-6 lg:min-w-[420px]">
          <div className="flex flex-wrap gap-4 text-sm font-medium text-zinc-500">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5 text-sm text-zinc-700">
            <div className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
              <CreditCard className="h-4 w-4 text-rose-500" />
              Merchant & Support Information
            </div>

            <div className="space-y-1 leading-6">
              <p>
                <strong>Business Name:</strong> MALLU CUPID
              </p>
              <p>
                <strong>Email:</strong> info@mallucupid.com
              </p>
              <p>
                <strong>Mobile:</strong> +91 9746109569
              </p>
              <p>
                <strong>Address:</strong> 46/A1, Aluva, Ernakulam, Kerala,
                India
              </p>
              <p>
                <strong>Business:</strong> Digital Products Marketplace
              </p>
              <p>
                <strong>Payments:</strong> Securely processed through Razorpay
                Software Private Limited.
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-zinc-500 lg:text-right">
          <p>&copy; {new Date().getFullYear()} MalluCupid. All rights reserved.</p>
          <p className="mt-1">Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}