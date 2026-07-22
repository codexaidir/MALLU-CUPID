import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandMark";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white px-6 py-14 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Link to="/" className="inline-flex" aria-label="MalluCupid home">
              <BrandLogo size="xl" />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-zinc-600">
              MalluCupid helps creators share free and paid content, chat with fans, and get paid securely via Razorpay.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-zinc-600">
            <a href="/#how-it-works" className="transition-colors hover:text-zinc-900">How it works</a>
            <Link to="/signup" className="transition-colors hover:text-zinc-900">Become a creator</Link>
            <Link to="/userlogin" className="transition-colors hover:text-zinc-900">Fan login</Link>
            <Link to="/contact-us" className="transition-colors hover:text-zinc-900">Contact</Link>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-6 text-sm text-zinc-500 md:flex-row md:items-center">
          <div>&copy; {new Date().getFullYear()} MalluCupid. All rights reserved.</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition-colors hover:text-zinc-900">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="transition-colors hover:text-zinc-900">Terms of Service</Link>
            <Link to="/refund-policy" className="transition-colors hover:text-zinc-900">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
