import { LoaderCircle } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";

const LOADING_QUOTE = {
  author: "Nelson Mandela",
  text: "It always seems impossible until it's done.",
};

export default function AppLoading() {
  return (
    <div className="bg-dot-pattern fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-paper-bg px-6 py-12">
      <section className="workbook-panel w-full max-w-xl overflow-hidden bg-paper-bg">
        <div className="px-6 py-6 text-center md:px-8 md:py-8">
          <div className="flex justify-center">
            <BrandLogo
              priority
              className="justify-center"
              iconClassName="rounded-2xl border-2 border-ink-fg bg-surface-white p-2 brutal-shadow-sm"
              labelClassName="text-xl"
              size={44}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink-fg bg-primary brutal-shadow-sm">
              <LoaderCircle className="h-8 w-8 animate-spin text-ink-fg" />
            </div>
          </div>

          <div className="mt-6">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink-fg md:text-[2.2rem]">
              Preparing your session
            </h1>
          </div>

          <div className="mt-6 border-t-4 border-ink-fg pt-6">
            <blockquote className="quote-text mx-auto max-w-[24rem] text-balance text-[1.3rem] leading-[1.25] text-ink-fg md:text-[1.55rem]">
              &ldquo;{LOADING_QUOTE.text}&rdquo;
            </blockquote>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-fg/65">
              {LOADING_QUOTE.author}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
