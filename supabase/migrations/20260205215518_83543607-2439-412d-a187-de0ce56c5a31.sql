
-- Fix the notifications INSERT policy to be more restrictive
DROP POLICY "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications for org members"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = notifications.user_id
    )
  );
