-- Add write policies for recommendations table
-- Allow users to insert their own recommendations
CREATE POLICY "Users can insert their own recommendations"
  ON public.recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own recommendations
CREATE POLICY "Users can update their own recommendations"
  ON public.recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own recommendations
CREATE POLICY "Users can delete their own recommendations"
  ON public.recommendations FOR DELETE
  USING (auth.uid() = user_id);