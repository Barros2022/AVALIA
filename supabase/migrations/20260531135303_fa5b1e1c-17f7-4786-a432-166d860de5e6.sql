-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- restaurants
CREATE TABLE public.restaurants (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT SELECT ON public.restaurants TO anon;
GRANT ALL ON public.restaurants TO service_role;

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurants" ON public.restaurants
  FOR SELECT USING (true);
CREATE POLICY "Owners can insert restaurants" ON public.restaurants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update restaurants" ON public.restaurants
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete restaurants" ON public.restaurants
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);

-- reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  food SMALLINT NOT NULL,
  service SMALLINT NOT NULL,
  ambiance SMALLINT NOT NULL,
  cleanliness SMALLINT NOT NULL,
  price SMALLINT NOT NULL,
  comment TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- validation trigger for rating ranges (1-5)
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.food < 1 OR NEW.food > 5
     OR NEW.service < 1 OR NEW.service > 5
     OR NEW.ambiance < 1 OR NEW.ambiance > 5
     OR NEW.cleanliness < 1 OR NEW.cleanliness > 5
     OR NEW.price < 1 OR NEW.price > 5 THEN
    RAISE EXCEPTION 'Ratings must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 1000 THEN
    RAISE EXCEPTION 'Comment too long';
  END IF;
  IF NEW.customer_name IS NOT NULL AND length(NEW.customer_name) > 100 THEN
    RAISE EXCEPTION 'Name too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review();

CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view reviews of their restaurants" ON public.reviews
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = reviews.restaurant_id AND r.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);