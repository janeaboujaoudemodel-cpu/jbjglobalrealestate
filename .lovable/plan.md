

## Delete AX Capital from the Database

### Why
AX Capital is a real estate brokerage, not a property developer. Per the platform's non-developer exclusion policy, it must be removed from the developers directory entirely.

### What Was Found
- **1 database record**: `developers` table, ID `6967923b-...`, slug `ax-capital`
- **0 linked projects** in the `projects` table
- **0 hardcoded references** anywhere in the codebase

### Action
Run a single database deletion:
```sql
DELETE FROM developers WHERE id = '6967923b-7a7d-4bd6-ad6a-94fd007a0abf';
```

This removes AX Capital from:
- The developers directory page
- The developer search modal
- The mega menu developer list (dynamically loaded)
- Any other page that queries the `developers` table

No code changes are needed since AX Capital is not hardcoded anywhere.

