import Link from "next/link";

type PickCardData = {
  id?: string;
  slug: string;
  category: string;
  title: string;
  dek: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  byline: string;
  pillars: string[];
};

export function PickHeroCard({
  pick,
  featured = false,
}: {
  pick: PickCardData;
  featured?: boolean;
}) {
  const categoryDisplay = pick.category.replace(/-/g, " ");

  if (featured) {
    return (
      <Link
        href={`/picks/${pick.category}/${pick.slug}`}
        className="group grid gap-8 md:grid-cols-2 md:gap-12"
      >
        <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
          {pick.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pick.hero_image_url}
              alt={pick.hero_image_alt || pick.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-cream flex h-full items-center justify-center px-6">
              <p className="text-amber font-serif text-4xl tracking-tight md:text-5xl capitalize text-center">
                {categoryDisplay}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-amber text-xs font-medium uppercase tracking-[0.2em]">
            Featured Pick &middot;{" "}
            <span className="capitalize">{categoryDisplay}</span>
          </p>
          <h2 className="text-ink group-hover:text-sage mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
            {pick.title}
          </h2>
          {pick.dek && (
            <p className="text-ink/75 mt-4 leading-relaxed">{pick.dek}</p>
          )}
          <p className="text-ink/60 mt-6 text-sm">By {pick.byline}</p>
          <span className="text-amber group-hover:text-sage mt-6 inline-block text-sm">
            Read the round-up →
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/picks/${pick.category}/${pick.slug}`} className="group">
      <div className="bg-mist border-stone aspect-[4/3] overflow-hidden rounded-2xl border">
        {pick.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pick.hero_image_url}
            alt={pick.hero_image_alt || pick.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-cream flex h-full items-center justify-center px-4">
            <p className="text-amber font-serif text-3xl tracking-tight capitalize text-center">
              {categoryDisplay}
            </p>
          </div>
        )}
      </div>
      <p className="text-sage mt-4 text-xs font-medium uppercase tracking-[0.2em]">
        Picks &middot; <span className="capitalize">{categoryDisplay}</span>
      </p>
      <h3 className="text-ink group-hover:text-sage mt-2 font-serif text-xl font-medium leading-snug tracking-tight">
        {pick.title}
      </h3>
      {pick.dek && (
        <p className="text-ink/70 mt-2 text-sm leading-relaxed">{pick.dek}</p>
      )}
      <p className="text-ink/60 mt-3 text-xs">By {pick.byline}</p>
    </Link>
  );
}
