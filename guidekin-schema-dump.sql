--
-- PostgreSQL database dump
--

\restrict O6wwj2LLrisKAzHmwbPvF5fAhcUdiaNOMSVhMhh8wOy7VoUVfWVId3nz7yWG4MC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    pillar text NOT NULL,
    dek text,
    body text DEFAULT ''::text NOT NULL,
    byline text NOT NULL,
    author_id uuid,
    image_url text,
    image_alt text,
    image_credit text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    seo_title text,
    seo_description text,
    image_search_terms text,
    CONSTRAINT articles_pillar_check CHECK ((pillar = ANY (ARRAY['body'::text, 'mind'::text, 'glow'::text, 'roam'::text, 'bonds'::text, 'years'::text]))),
    CONSTRAINT articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: COLUMN articles.image_search_terms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.articles.image_search_terms IS 'Suggested search queries for sourcing a hero image. Editor-facing only, not displayed publicly.';


--
-- Name: editors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.editors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    display_name text NOT NULL,
    role text DEFAULT 'editor'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT editors_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text])))
);


--
-- Name: landing_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    entry_file text DEFAULT 'index.html'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    use_site_chrome boolean DEFAULT false NOT NULL,
    chrome_revert_to boolean,
    chrome_revert_at timestamp with time zone
);


--
-- Name: TABLE landing_pages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.landing_pages IS 'Custom partner landing pages served at /lp/<slug>. Files are stored in Supabase Storage bucket "landing-pages".';


--
-- Name: COLUMN landing_pages.entry_file; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.landing_pages.entry_file IS 'Filename of the entry HTML within the page bundle. Defaults to index.html.';


--
-- Name: COLUMN landing_pages.use_site_chrome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.landing_pages.use_site_chrome IS 'When true, the public /lp/<slug> route strips the partner header/footer (best-effort) and injects Guide Kin chrome.';


--
-- Name: COLUMN landing_pages.chrome_revert_to; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.landing_pages.chrome_revert_to IS 'Value to restore use_site_chrome to once chrome_revert_at passes. NULL means no auto-revert scheduled.';


--
-- Name: COLUMN landing_pages.chrome_revert_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.landing_pages.chrome_revert_at IS 'When the scheduled revert fires. NULL means the current setting is permanent.';


--
-- Name: pick_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pick_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pick_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    badge text,
    name text NOT NULL,
    brand text,
    image_url text,
    image_alt text,
    take text NOT NULL,
    pros text[],
    cons text[],
    specs jsonb,
    retailer_name text,
    retailer_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN pick_products.specs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pick_products.specs IS 'Free-form key/value pairs displayed as a small specs table. Example: {"Weight": "200g", "Battery": "8 hours"}';


--
-- Name: picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.picks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    dek text,
    hero_image_url text,
    hero_image_alt text,
    intro text,
    methodology text,
    byline text DEFAULT 'The Guide Kin team'::text NOT NULL,
    pillars text[] DEFAULT ARRAY[]::text[] NOT NULL,
    seo_title text,
    seo_description text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid,
    CONSTRAINT picks_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: TABLE picks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.picks IS 'Product round-up reviews. Each pick contains multiple products. Distinct from articles.';


--
-- Name: COLUMN picks.pillars; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.picks.pillars IS 'Array of pillar slugs (body, mind, glow, roam, bonds, years) this pick relates to. Used for cross-linking from pillar pages.';


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    pillars text[] DEFAULT '{}'::text[] NOT NULL,
    consent_email boolean DEFAULT false NOT NULL,
    consent_sms boolean DEFAULT false NOT NULL,
    consent_email_at timestamp with time zone,
    consent_sms_at timestamp with time zone,
    consent_ip text,
    consent_user_agent text,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT subscribers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'unsubscribed'::text, 'bounced'::text])))
);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: editors editors_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editors
    ADD CONSTRAINT editors_email_key UNIQUE (email);


--
-- Name: editors editors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editors
    ADD CONSTRAINT editors_pkey PRIMARY KEY (id);


--
-- Name: editors editors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editors
    ADD CONSTRAINT editors_user_id_key UNIQUE (user_id);


--
-- Name: landing_pages landing_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_pkey PRIMARY KEY (id);


--
-- Name: landing_pages landing_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_slug_key UNIQUE (slug);


--
-- Name: pick_products pick_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_products
    ADD CONSTRAINT pick_products_pkey PRIMARY KEY (id);


--
-- Name: picks picks_category_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT picks_category_slug_key UNIQUE (category, slug);


--
-- Name: picks picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT picks_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);


--
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);


--
-- Name: articles_pillar_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_pillar_idx ON public.articles USING btree (pillar);


--
-- Name: articles_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_published_at_idx ON public.articles USING btree (published_at DESC);


--
-- Name: articles_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_slug_idx ON public.articles USING btree (slug);


--
-- Name: articles_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_status_idx ON public.articles USING btree (status);


--
-- Name: editors_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editors_user_id_idx ON public.editors USING btree (user_id);


--
-- Name: idx_landing_pages_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_active ON public.landing_pages USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_landing_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_slug ON public.landing_pages USING btree (slug);


--
-- Name: idx_pick_products_pick_id_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pick_products_pick_id_position ON public.pick_products USING btree (pick_id, "position");


--
-- Name: idx_picks_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_category ON public.picks USING btree (category);


--
-- Name: idx_picks_pillars; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_pillars ON public.picks USING gin (pillars);


--
-- Name: idx_picks_status_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_status_published_at ON public.picks USING btree (status, published_at DESC) WHERE (status = 'published'::text);


--
-- Name: subscribers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscribers_email_idx ON public.subscribers USING btree (email);


--
-- Name: articles set_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: landing_pages set_landing_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pick_products set_pick_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pick_products_updated_at BEFORE UPDATE ON public.pick_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: picks set_picks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_picks_updated_at BEFORE UPDATE ON public.picks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: site_settings set_site_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscribers set_subscribers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: landing_pages landing_pages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.editors(id);


--
-- Name: pick_products pick_products_pick_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_products
    ADD CONSTRAINT pick_products_pick_id_fkey FOREIGN KEY (pick_id) REFERENCES public.picks(id) ON DELETE CASCADE;


--
-- Name: picks picks_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT picks_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.editors(id);


--
-- Name: articles Public can read published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read published articles" ON public.articles FOR SELECT USING ((status = 'published'::text));


--
-- Name: site_settings Public can read site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: editors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.editors ENABLE ROW LEVEL SECURITY;

--
-- Name: landing_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: pick_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pick_products ENABLE ROW LEVEL SECURITY;

--
-- Name: picks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict O6wwj2LLrisKAzHmwbPvF5fAhcUdiaNOMSVhMhh8wOy7VoUVfWVId3nz7yWG4MC

