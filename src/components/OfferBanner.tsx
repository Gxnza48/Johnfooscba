"use client";

interface Props {
  show: boolean;
  text: string;
}

export default function OfferBanner({ show, text }: Props) {
  if (!show || !text.trim()) return null;
  return (
    <div className="bg-offer text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[13px] font-600 uppercase tracking-wide sm:px-6">
        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
        {text}
      </div>
    </div>
  );
}
