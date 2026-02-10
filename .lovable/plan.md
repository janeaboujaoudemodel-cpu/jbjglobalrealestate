# Plan Status: COMPLETED

All tasks from the uncompleted backlog have been implemented:

1. ✅ **News card category labels** — Changed to white text on dark backdrop (`text-white bg-black/50`)
2. ✅ **Duplicate image blocklist** — Added 4 new bad URLs to `KNOWN_BAD_URLS` and deployed; `fix-images` triggered
3. ✅ **NewsDetail hero height** — Updated to `h-[80vh] md:h-[90vh]`
4. ✅ **Daily news sync** — pg_cron jobs: collect at 6 AM UAE, enrich at 6:30 AM UAE
5. ✅ **Daily Provident sync** — pg_cron job: discover at 7 AM UAE
6. ✅ **New Project Detector** — `NewProjectDetector` component added to listing admin approval queue
