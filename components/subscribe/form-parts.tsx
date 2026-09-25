import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Shared building blocks for the subscribe-style signup pages (/subscribe,
// /sub-health). Markup mirrors the original /subscribe page exactly.

const inputClass =
  "border-stone text-ink placeholder:text-ink/40 focus:border-sage mt-2 w-full rounded-xl border bg-white px-4 py-3 focus:outline-none";

export function SubscribeHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-cream border-b border-stone">
      <div className="mx-auto max-w-3xl px-6 py-12 text-center md:py-16">
        <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
        <h1 className="text-ink mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="text-ink/75 mx-auto mt-4 max-w-xl leading-relaxed">
          {children}
        </p>
      </div>
    </section>
  );
}

export function SubscribeThankYou({
  eyebrow,
  title,
  children,
  footerExtra,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footerExtra?: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-cream border-b border-stone">
          <div className="mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
            <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
              {eyebrow}
            </p>
            <h1 className="text-ink mt-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="text-ink/75 mx-auto mt-6 max-w-xl leading-relaxed">
              {children}
            </p>
            <div className="mt-10">
              <Link
                href="/"
                className="bg-sage inline-block rounded-full px-7 py-3 text-sm text-white hover:opacity-90"
              >
                Back to Guide Kin
              </Link>
            </div>
          </div>
        </section>
      </main>
      {footerExtra}
      <SiteFooter />
    </>
  );
}

export function SubscribeFormCard({
  onSubmit,
  children,
  containerProps,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  containerProps?: { [key: `data-${string}`]: string };
}) {
  return (
    <section className="bg-cream">
      <div {...containerProps} className="mx-auto max-w-2xl px-6 py-10 md:py-14">
        <form
          onSubmit={onSubmit}
          className="bg-white border-stone rounded-2xl border p-6 shadow-sm md:p-10"
        >
          {children}
        </form>
      </div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
      {children}
    </p>
  );
}

export function SectionHint({ children }: { children: React.ReactNode }) {
  return <p className="text-ink/60 mt-2 text-xs">{children}</p>;
}

export function Divider() {
  return (
    <div
      style={{
        borderTop: "1px solid #D3D1C7",
        marginTop: "2rem",
        marginBottom: "2rem",
      }}
    />
  );
}

export function TextField({
  id,
  label,
  note,
  hint,
  ...inputProps
}: {
  id: string;
  label: string;
  note?: string;
  hint?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {note ? `${label} ` : label}
        {note && <span className="text-ink/50 font-normal">{note}</span>}
      </label>
      <input id={id} name={id} {...inputProps} className={inputClass} />
      {hint && <p className="text-ink/50 mt-2 text-xs">{hint}</p>}
    </div>
  );
}

export function ChoiceChips({
  name,
  options,
  selected,
  onToggle,
  gridClassName = "grid-cols-2 sm:grid-cols-3",
}: {
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  gridClassName?: string;
}) {
  return (
    <div className={`mt-5 grid gap-2.5 ${gridClassName}`}>
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <label
            key={o.value}
            className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 transition ${
              checked
                ? "border-sage bg-mist"
                : "border-stone bg-white hover:border-sage/50"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onToggle(o.value)}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${checked ? "text-sage" : "text-ink"}`}>
              {o.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

type DataAttributes = { [key: `data-${string}`]: string };

export function ConsentCheckbox({
  name,
  children,
  labelProps,
  inputProps,
}: {
  name: string;
  children: React.ReactNode;
  labelProps?: DataAttributes;
  inputProps?: DataAttributes;
}) {
  return (
    <label {...labelProps} className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        {...inputProps}
        className="accent-sage mt-1 h-4 w-4 flex-shrink-0"
      />
      <span className="text-ink/85 text-sm leading-relaxed">{children}</span>
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="bg-mist border-amber/40 mt-6 rounded-xl border p-4 text-sm text-ink">
      {message}
    </div>
  );
}

export function SubmitButton({
  submitting,
  label,
  busyLabel,
  ...buttonProps
}: {
  submitting: boolean;
  label: string;
  busyLabel: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement> & { [key: `data-${string}`]: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      {...buttonProps}
      className="bg-sage mt-6 w-full cursor-pointer rounded-full px-6 py-4 text-base text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? busyLabel : label}
    </button>
  );
}
