# HOTFIX — Dashboard today ring alignment + Blocked dates click not working (Cursor Agent)

> **Scope:** 2 files. Frontend only.
> **Acceptance:** `npx tsc --noEmit` passes. Today's date ring is centered. Blocked dates page responds to clicks.

---

## BUG 1: Dashboard calendar — "today" blue ring is misaligned

**File:** `frontend/src/pages/admin/DashboardPage.tsx`

The blue dashed/solid ring around today's date is not centered on the number — it's offset. This is because the `ring-2` utility or a custom border is applied to the day cell but the cell's content isn't centered, or the ring is on the wrong element.

**Fix:** Find how "today" is styled in the DayPicker. Look for either:
- A `modifiers` + `modifiersStyles` or `modifiersClassNames` that targets today
- Or a `today` style in the `styles` prop

Replace the today styling with a simpler approach that centers properly:

```typescript
modifiers={{
  today: new Date(),
  // ... other modifiers
}}
modifiersStyles={{
  today: {
    fontWeight: 'bold',
    backgroundColor: '#EEF2FF',  // indigo-50
    borderRadius: '0.5rem',
    color: '#4338CA',             // indigo-700
  },
  // ... other modifier styles
}}
```

If using `modifiersClassNames`, use:
```typescript
modifiersClassNames={{
  today: 'font-bold bg-indigo-50 text-indigo-700 rounded-lg',
  // ... other modifiers
}}
```

**Key:** Do NOT use `ring-*` or `outline-*` utilities for the today indicator — they don't align well with react-day-picker's cell layout. Use a background color change + bold text instead. This is more visible for someone with poor eyesight anyway.

Also make sure the DayPicker's `today` prop is not being set to something weird. By default, react-day-picker v9 highlights today automatically. You can customize it via `modifiers={{ today: new Date() }}` but it should work out of the box.

---

## BUG 2: Blocked Dates page — clicking dates does nothing

**File:** `frontend/src/pages/admin/BlockedDatesPage.tsx`

Clicking on a date number in the blocked dates calendar has no effect. The dates should:
- **Available date click** → add to selection (blue highlight), ready to be blocked
- **Already-blocked date click** → unblock immediately

**Diagnosis:** The DayPicker `onDayClick` handler is likely not wired up, or the `mode` prop is preventing interaction. In react-day-picker v9, the interaction model changed.

**Fix:** Make sure each DayPicker has:

```tsx
<DayPicker
  mode="multiple"
  selected={selectedDates}
  onSelect={(dates) => setSelectedDates(dates ?? [])}
  onDayClick={(date) => handleDayClick(date, propertyId, blockedSet, blockedList)}
  // ... other props
/>
```

Where `handleDayClick` checks if the clicked date is already blocked:

```typescript
const handleDayClick = (
  date: Date,
  propertyId: string,
  blockedSet: Set<string>,
  blockedList: BlockedDate[] | undefined
) => {
  const key = format(date, 'yyyy-MM-dd');
  if (blockedSet.has(key)) {
    // Already blocked — unblock it
    const record = blockedList?.find((b) => b.date.slice(0, 10) === key);
    if (record) unblockMutation.mutate(record._id);
  }
  // If not blocked, onSelect handles adding/removing from selectedDates
};
```

**Common v9 pitfall:** In react-day-picker v9, `onDayClick` fires BEFORE `onSelect`. If you call both, make sure they don't conflict. The cleanest approach for this use case:

1. Use `mode="multiple"` with `onSelect` for selecting available dates
2. Use `onDayClick` ONLY for the unblock action (when clicking a blocked date)
3. In `onDayClick`, check if the date is blocked. If yes, unblock and return. If no, let `onSelect` handle it naturally.

**Also check:** Make sure the `disabled` prop on DayPicker is not accidentally disabling all dates. If there's a `disabled` function or array, blocked dates should NOT be in it — they need to be clickable for unblocking.

If blocked dates are in the `disabled` array/function, that's why clicking them does nothing. Remove them from `disabled` and instead just style them differently via `modifiers`.

---

## VERIFICATION

```bash
cd frontend
npx tsc --noEmit   # Must pass
npm run dev
```

**Visual checks:**
1. Dashboard: today's date (March 5) has a clean, centered highlight (background color, not a ring)
2. Blocked Dates page: click a date number → it gets selected (blue). Click "Block selected dates" → it turns red.
3. Blocked Dates page: click a red blocked date → it gets unblocked (turns white again)
