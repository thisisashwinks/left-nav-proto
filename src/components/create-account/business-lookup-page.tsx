"use client";

import * as React from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { usePageChrome } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { DEFAULT_QUERY, searchPlaces, type BusinessPlace } from "./flow-data";

/**
 * "Find your client's business" — pick the listing, and the form fills itself.
 *
 * The lookup is the reason the form after it is mostly confirmation rather
 * than typing: name, address, city, state and ZIP all come off the listing.
 * Add manually is the way out for a business with no listing yet.
 */
export function BusinessLookupPage({
  title,
  onBack,
  onPick,
  onAddManually,
}: {
  /** "Restaurant Industry", or "Snapshot" on the snapshot path. */
  title: string;
  onBack: () => void;
  onPick: (place: BusinessPlace) => void;
  onAddManually: () => void;
}) {
  const { effective } = useTheme();
  const showTitle = usePageChrome().title;
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const results = searchPlaces(query);

  return (
    <div
      data-page-theme={effective.appTheme}
      className="flex h-full min-h-0 flex-col overflow-y-auto bg-pg-bg"
    >
      <header className="flex shrink-0 items-center gap-[8px] px-[12px] pt-[12px]">
        <button
          type="button"
          aria-label="Back to sub-accounts"
          onClick={onBack}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-pg-text hover:bg-pg-surface hover:text-pg-heading"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        {showTitle ? (
          <h1 className="truncate text-[20px] leading-[28px] font-semibold text-pg-heading">
            {title}
          </h1>
        ) : null}
      </header>

      <div className="p-[12px]">
        <section className="flex flex-col gap-[16px] rounded-[8px] bg-pg-surface px-[16px] pt-[16px] pb-[24px] shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_3px_rgba(16,24,40,0.1),0_1px_2px_rgba(16,24,40,0.06)] sm:px-[24px]">
          <div className="flex flex-col">
            <h2 className="text-[20px] leading-[30px] font-bold text-pg-heading">
              Find your client&rsquo;s business
            </h2>
            <p className="max-w-[702px] text-[13px] leading-[18px] text-pg-heading">
              Search by name and pick the right location. We&rsquo;ll fill in the
              name, address, phone and other details from the listing.
            </p>
          </div>

          <div className="flex min-h-[48px] items-center gap-[22px]">
            <label className="flex h-[37px] min-w-0 flex-1 items-center gap-[8px] rounded-[6px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_#cdd5df] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
              <Search size={18} aria-hidden="true" className="shrink-0 text-pg-text" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by business name"
                aria-label="Search for the business"
                className="min-w-0 flex-1 bg-transparent text-[12px] leading-[17px] text-[#182230] placeholder:text-pg-faint focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={onAddManually}
              className="motion-tap shrink-0 text-[14px] leading-[20px] font-semibold text-[var(--hr-primary-700)] hover:underline"
            >
              Add manually
            </button>
          </div>

          <div className="flex flex-col gap-[24px]">
            {/*
              The listing's map, as the Figma crops it. Static: the pins are
              part of the image, and a live map here would be a dependency and
              an API key for a picture nobody interacts with.
            */}
            <div className="relative h-[326px] w-full overflow-hidden rounded-[12px] bg-[#e5e3df]">
              <div className="absolute top-[-25px] left-[-286px] h-[768px] w-[1769px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Map of New Delhi with the matching locations pinned"
                  src="/create-account/map-delhi.png"
                  className="absolute top-[-44.52%] left-0 h-[148.58%] w-full max-w-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[16px]">
              <h3 className="text-[18px] leading-[28px] font-medium text-[#182230]">
                Pick an address
              </h3>
              <div className="overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <div className="flex h-[44px] items-center bg-[#fcfcfd] pl-[52px] text-[12px] leading-[17px] font-medium text-[#182230] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
                  Business
                </div>
                {results.length === 0 ? (
                  <p className="px-[14px] py-[18px] text-[13px] leading-[18px] text-pg-muted">
                    {query.trim().length < 2
                      ? "Type the business name to see matching listings."
                      : "No listings found. Add the business manually instead."}
                  </p>
                ) : (
                  <ul>
                    {results.map((place) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          onClick={() => onPick(place)}
                          className="motion-tap flex min-h-[71px] w-full items-center gap-[14px] px-[14px] py-[11px] text-left shadow-[inset_0_-1px_0_0_var(--pg-border)] hover:bg-[var(--hr-primary-25)]"
                        >
                          <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#eaf0ff]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="" src="/create-account/icon-place.svg" width={15} height={15} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-[4px] text-[12px] leading-[17px]">
                            <span className="text-[#182230]">{place.title}</span>
                            <span className="text-[#475467]">{place.address}</span>
                          </span>
                          <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-pg-text" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
