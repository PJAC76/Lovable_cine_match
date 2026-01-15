-- =============================================
-- CINEMATCH DATABASE SCHEMA
-- =============================================

-- 1. Create ENUM for media type
CREATE TYPE public.media_type AS ENUM ('movie', 'series');

-- 2. Create ENUM for source platforms
CREATE TYPE public.source_platform AS ENUM ('forocoches', 'filmaffinity', 'reddit');

-- 3. Create ENUM for ranking type
CREATE TYPE public.ranking_type AS ENUM ('historical', 'recent');

-- 4. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create media_items table
CREATE TABLE public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type media_type NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    genres TEXT[] NOT NULL DEFAULT '{}',
    poster_url TEXT,
    synopsis_short TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create sources_scores table (scores from each platform)
CREATE TABLE public.sources_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_item_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
    source source_platform NOT NULL,
    score_normalized DECIMAL(3,1) NOT NULL CHECK (score_normalized >= 0 AND score_normalized <= 10),
    votes_count INTEGER NOT NULL DEFAULT 0,
    scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(media_item_id, source)
);

-- 7. Create aggregated_scores table (final ranking scores)
CREATE TABLE public.aggregated_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_item_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
    final_score DECIMAL(3,1) NOT NULL CHECK (final_score >= 0 AND final_score <= 10),
    ranking_type ranking_type NOT NULL,
    total_votes INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(media_item_id, ranking_type)
);

-- 8. Create user_favorites table
CREATE TABLE public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_item_id)
);

-- 9. Create recommendations table
CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
    reason_text TEXT NOT NULL,
    score DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_item_id)
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregated_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile, update their own
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- MEDIA_ITEMS: Public read access (everyone can see movies/series)
CREATE POLICY "Anyone can view media items"
    ON public.media_items FOR SELECT
    USING (true);

-- SOURCES_SCORES: Public read access
CREATE POLICY "Anyone can view source scores"
    ON public.sources_scores FOR SELECT
    USING (true);

-- AGGREGATED_SCORES: Public read access
CREATE POLICY "Anyone can view aggregated scores"
    ON public.aggregated_scores FOR SELECT
    USING (true);

-- USER_FAVORITES: Users can CRUD their own favorites
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to favorites"
    ON public.user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from favorites"
    ON public.user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- RECOMMENDATIONS: Users can view their own recommendations
CREATE POLICY "Users can view their own recommendations"
    ON public.recommendations FOR SELECT
    USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for media_items
CREATE TRIGGER on_media_items_updated
    BEFORE UPDATE ON public.media_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_media_items_type ON public.media_items(type);
CREATE INDEX idx_media_items_genres ON public.media_items USING GIN(genres);
CREATE INDEX idx_sources_scores_media ON public.sources_scores(media_item_id);
CREATE INDEX idx_aggregated_scores_media ON public.aggregated_scores(media_item_id);
CREATE INDEX idx_aggregated_scores_ranking ON public.aggregated_scores(ranking_type, final_score DESC);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_recommendations_user ON public.recommendations(user_id);