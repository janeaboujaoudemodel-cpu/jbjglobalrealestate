

## Fix Back Button Styling in Support Ticket Hub

### Problem
The "Back" button is not readable because it uses `variant="outline"` which adds base styles that conflict with the gold theme. The "Refresh" button looks premium and readable because it uses direct custom classes.

### Current Styling Comparison

| Button | Current Style |
|--------|---------------|
| **Back** | `variant="outline" size="sm" className="border-gold/50 bg-transparent text-gold hover:bg-gold/10"` |
| **Refresh** | No variant, `className="bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30"` |

### Solution
Remove the `variant="outline"` from the Back button and apply the same premium styling as the Refresh button.

### Technical Details

**File: `src/pages/SupportTicketHub.tsx`**

Change lines 71-79 from:
```tsx
<Button
  onClick={() => navigate(-1)}
  variant="outline"
  size="sm"
  className="border-gold/50 bg-transparent text-gold hover:bg-gold/10 hover:text-gold"
>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back
</Button>
```

To:
```tsx
<Button
  onClick={() => navigate(-1)}
  className="bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30"
>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back
</Button>
```

### Result
Both buttons will have identical premium styling:
- Semi-transparent gold background (`bg-gold/20`)
- Gold border (`border border-gold/50`)
- Gold text (`text-gold`)
- Hover state with darker gold background (`hover:bg-gold/30`)

