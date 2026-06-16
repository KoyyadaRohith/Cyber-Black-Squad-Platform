/**
 * Cyber Black Squad — Supabase client configuration (safe template)
 *
 * IMPORTANT:
 * - Do NOT commit production keys to source control.
 * - Place this file (or a build-time replacement) and include it before `js/db.js` in your HTML.
 * - Example usage in HTML:
 *   <script src="js/config.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js"></script>
 *   <script src="js/db.js"></script>
 */

window.CBS_CONFIG = window.CBS_CONFIG || {
  // Replace the placeholders below with your project's values.
  SUPABASE_URL: 'https://gpfsiizfnhxwranqcclf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnNpaXpmbmh4d3JhbnFjY2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzk3NjMsImV4cCI6MjA5Njg1NTc2M30.CcpjlsXUDWMo-o1hvY_YRdxccE_JWbVmWCxDxLo4RIw'
};

window.cbsConfigIsValid = function() {
  const c = window.CBS_CONFIG || {};
  return Boolean(c.SUPABASE_URL && c.SUPABASE_ANON_KEY && !c.SUPABASE_URL.includes('YOUR_') && !c.SUPABASE_ANON_KEY.includes('YOUR_'));
};
