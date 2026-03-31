

## Fix Missing Developer Logos for Meraas and Binghatti

### Problem

The previous database cleanup correctly removed the corrupted `habtoor_polo_villas` photo from all developers, but set Meraas and Binghatti `logo_url` to NULL because no clean sibling record existed. This causes the UI to show a fake initial letter ("M" for Meraas, "B" for Binghatti) instead of a real logo. The user considers this a violation -- every developer must show its official logo.

### Root Cause

Meraas (4 records) and Binghatti (2 records) never had a correct `logo_url` in any database record. All copies either had the corrupt photo or NULL. The Reelly API sync cannot fix this because the API key returns 401 (expired/invalid).

### Fix: Database Update

Insert the correct, publicly accessible logo URLs for these developers:

| Developer | Records | Logo Source |
|-----------|---------|-------------|
| Meraas | `meraas`, `developed-by-meraas` | `https://static.cdnlogo.com/logos/m/18/meraas.svg` (official Meraas logo, black wordmark with icon) |
| Binghatti | `binghatti`, `developed-by-binghatti` | `https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_Binghatti.jpg` (official Binghatti logo from Wikimedia Commons) |

Both URLs are verified as publicly accessible and match the official logos visible on meraas.com and binghatti.com respectively.

### SQL (via insert tool)

```sql
UPDATE developers SET logo_url = 'https://static.cdnlogo.com/logos/m/18/meraas.svg'
WHERE slug IN ('meraas', 'developed-by-meraas');

UPDATE developers SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_Binghatti.jpg'
WHERE slug IN ('binghatti', 'developed-by-binghatti');
```

### Verification

After the database update, take a screenshot of the homepage to confirm:
- Meraas projects show the real Meraas logo (black icon + wordmark)
- Binghatti projects show the real Binghatti logo
- No developer shows a letter initial or property photo as logo
- Logo containers remain clean `bg-white/90`

### What stays untouched
- All code files -- no changes needed
- All other developer logos -- already correct
- Logo rendering components -- working correctly
- Logo container styling -- remains `bg-white/90`

