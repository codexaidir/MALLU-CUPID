import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandMark";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
          <div>
            <Link to="/" className="inline-flex" aria-label="MalluCupid home">
              <BrandLogo size="md" />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              MalluCupid helps creators share free and paid content, chat with fans, and get paid securely via Razorpay.
            </p>
            <ul className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-600">
              <Link to="/#how-it-works" className="hover:text-zinc-900">How it works</Link>
              <Link to="/signup" className="hover:text-zinc-900">Become a creator</Link>
              <Link to="/userlogin" className="hover:text-zinc-900">Fan login</Link>
              <Link to="/contact-us" className="hover:text-zinc-900">Contact</Link>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div className="mb-2 font-semibold text-zinc-900">Merchant details</div>
            <div className="text-sm leading-6">
              <div><strong>Company:</strong> MALLU CUPID</div>
              <div><strong>Email:</strong> support@mallucupid.com / info@mallucupid.com</div>
              <div><strong>Mobile:</strong> +91-9581150441</div>
              <div><strong>Address:</strong> 456, Gautam Nagar, JP Nagar 7th Phase, Bengaluru, Karnataka 560078, India</div>
              <div className="mt-1 text-xs text-zinc-500">Payments processed via Razorpay</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-6 text-sm text-zinc-500 md:flex-row md:items-center">
          <div>&copy; {new Date().getFullYear()} MalluCupid. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy-policy" className="hover:text-zinc-900">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-zinc-900">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-zinc-900">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
