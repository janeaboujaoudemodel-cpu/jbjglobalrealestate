

# Add Frontend Validation for Service Category Field

## Overview

Add inline validation error message for the Service Category field in `SupportTicketBox.tsx` and `CustomerHappiness.tsx` to prevent form submission without a selection, matching the validation pattern used for other required fields.

## Current Behavior

- **SupportTicketBox.tsx**: Uses simple state management (no react-hook-form). Validation only happens on submit via `toast.error()` - no inline error messages are shown.
- **CustomerHappiness.tsx**: Same pattern - no inline validation, relies on browser's default `required` behavior for inputs but Select components don't have native required validation.

## Implementation Approach

Since the forms use simple `useState` instead of react-hook-form, I'll add a `fieldErrors` state object to track validation errors per field and display inline error messages below the Service Category select component.

---

## Changes for `SupportTicketBox.tsx`

### 1. Add Field Errors State

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

### 2. Update handleSubmit Validation

Replace toast-only validation with state-based field error tracking:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Clear previous errors
  const errors: Record<string, string> = {};
  
  if (!formData.serviceCategory) {
    errors.serviceCategory = "Please select a service category";
  }
  if (!formData.subject) {
    errors.subject = "Subject is required";
  }
  if (!formData.description) {
    errors.description = "Description is required";
  }
  if (!formData.fullName) {
    errors.fullName = "Full name is required";
  }
  if (!formData.email) {
    errors.email = "Email is required";
  }
  if (formData.serviceCategory === "Other" && !formData.otherCategoryDetail.trim()) {
    errors.otherCategoryDetail = "Please specify the type of issue";
  }
  
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }
  
  setFieldErrors({});
  // ... rest of submit logic
};
```

### 3. Add Inline Error Message Below Select

After the Service Category Select component (around line 696):

```tsx
{/* Service Category */}
<div>
  <Label className="text-zinc-700 flex items-center gap-2">
    <AlertCircle className="w-4 h-4 text-red-500" />
    Service with Issue *
  </Label>
  <Select
    value={formData.serviceCategory}
    onValueChange={(value) => {
      setFormData({ ...formData, serviceCategory: value, otherCategoryDetail: value !== "Other" ? "" : formData.otherCategoryDetail });
      if (fieldErrors.serviceCategory) {
        setFieldErrors(prev => ({ ...prev, serviceCategory: '' }));
      }
    }}
  >
    <SelectTrigger className={`mt-1 bg-white border-2 ${fieldErrors.serviceCategory ? 'border-red-500' : 'border-gold/40'} focus:border-gold text-black rounded-lg cursor-pointer`}>
      <SelectValue placeholder="Select the service" />
    </SelectTrigger>
    <SelectContent className="max-h-60">
      {SERVICE_CATEGORIES.map((category) => (
        <SelectItem key={category} value={category}>
          {category}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {fieldErrors.serviceCategory && (
    <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceCategory}</p>
  )}
</div>
```

### 4. Clear Error on Field Change

Add error clearing to the `onValueChange` handler to provide immediate feedback when the user makes a selection.

### 5. Reset Errors on Form Reset

Update `resetForm()` and `submitAnotherTicket()` functions to also clear `fieldErrors`:

```typescript
const resetForm = () => {
  // ... existing code
  setFieldErrors({});
};

const submitAnotherTicket = () => {
  // ... existing code
  setFieldErrors({});
};
```

---

## Changes for `CustomerHappiness.tsx`

Apply the same pattern:

### 1. Add Field Errors State

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

### 2. Update handleSubmit with Validation

Add validation check before submission with inline error support.

### 3. Add Inline Error Below Select

```tsx
<div>
  <Label htmlFor="serviceCategory" className="text-black">
    Service with Issue *
  </Label>
  <Select
    value={formData.serviceCategory}
    onValueChange={(v) => {
      setFormData({ ...formData, serviceCategory: v });
      if (fieldErrors.serviceCategory) {
        setFieldErrors(prev => ({ ...prev, serviceCategory: '' }));
      }
    }}
  >
    <SelectTrigger className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 ${fieldErrors.serviceCategory ? 'border-red-500' : 'border-gold/40'} text-black`}>
      <SelectValue placeholder="Select service" />
    </SelectTrigger>
    <SelectContent>
      {SUPPORT_SERVICE_CATEGORIES.map((c) => (
        <SelectItem key={c} value={c}>
          {c}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {fieldErrors.serviceCategory && (
    <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceCategory}</p>
  )}
</div>
```

---

## Visual Behavior

| State | Appearance |
|-------|------------|
| Default | Gold border (`border-gold/40`) |
| Error | Red border (`border-red-500`) + error message below |
| After selection | Error clears immediately, border returns to gold |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SupportTicketBox.tsx` | Add `fieldErrors` state, update validation, add inline error message |
| `src/pages/CustomerHappiness.tsx` | Add `fieldErrors` state, update validation, add inline error message |

---

## Technical Notes

- Error message style matches existing patterns: `text-red-500 text-xs mt-1`
- Border highlight on error uses `border-red-500` matching other form components
- Errors clear on selection to provide immediate feedback
- Form reset clears all field errors

