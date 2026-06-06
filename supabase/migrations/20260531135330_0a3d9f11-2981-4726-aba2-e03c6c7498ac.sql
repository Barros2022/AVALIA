-- fix search_path on validate_review
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

-- restrict execution of security definer/trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_review() FROM public, anon, authenticated;

-- tighten review insert policy to existing restaurants only
DROP POLICY "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews for existing restaurants" ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id)
  );