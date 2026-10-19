# Public Events page

`/events/` is a static, public page using the existing logo, aircraft image, design tokens, navigation and footer. No database connection, signup form, attendee information or sample events are included in this first phase.

The upcoming list container is `#events-list`; `#events-empty` is the visible fallback when nothing has been published. Event times are presented as UTC. The page works without JavaScript.

For the later ACARS integration, inspect the current event schema and publication workflow before choosing a public data contract. Expose only event information explicitly intended for publication. Draft/cancelled event behaviour, event times, edits and deletion should be handled consistently. Do not expose attendance lists, pilot IDs, management notes or account information. Keep the current empty state and add accessible loading/error states when the data connection is introduced. This phase does not change Supabase or ACARS.
