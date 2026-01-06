# Next.js 15+ Params Compatibility Analysis

## Overview
This document catalogs all components across the Next.js applications that need to be updated for Next.js 15+ compatibility, where `params` are now Promise-based instead of synchronous objects.

## Affected Applications

### 1. Web Application (`apps/web`)

#### Files with Direct Params Access (CRITICAL - Need Immediate Fix)

**File:** `apps/web/src/app/dashboard/business/[id]/edit/page.tsx`
- **Line 34:** `export default function EditBusinessPage({ params }: { params: { id: string } })`
- **Line 41:** `queryKey: ['business', params.id],`
- **Line 43:** `const response = await api.get<BusinessData>(\`/businesses/${params.id}\`);`
- **Line 68:** `return api.put(\`/businesses/${params.id}\`, data);`
- **Line 72:** `queryClient.invalidateQueries({ queryKey: ['business', params.id] });`
- **Pattern:** Direct property access without awaiting
- **Impact:** Runtime errors in Next.js 15+

**File:** `apps/web/src/app/dashboard/business/[id]/analytics/page.tsx`
- **Line 24:** `export default function BusinessAnalyticsPage({ params }: { params: { id: string } })`
- **Line 28:** `queryKey: ['business', params.id],`
- **Line 30:** `const response = await api.get(\`/businesses/${params.id}\`);`
- **Line 36:** `queryKey: ['business-stats', params.id],`
- **Pattern:** Direct property access without awaiting
- **Impact:** Runtime errors in Next.js 15+

#### Files Already Using Correct Pattern (No Changes Needed)

**File:** `apps/web/src/app/district/[slug]/page.tsx`
- **Line 39:** `{ params }: { params: Promise<{ slug: string }> }`
- **Line 41:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

**File:** `apps/web/src/app/governorate/[slug]/page.tsx`
- **Line 27:** `{ params }: { params: Promise<{ slug: string }> }`
- **Line 29:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

**File:** `apps/web/src/app/city/[slug]/page.tsx`
- **Line 54:** `{ params }: { params: Promise<{ slug: string }> }`
- **Line 56:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

**File:** `apps/web/src/app/category/[slug]/page.tsx`
- **Line 51:** `{ params }: Props`
- **Line 53:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

**File:** `apps/web/src/app/subcategory/[slug]/page.tsx`
- **Line 51:** `{ params }: Props`
- **Line 53:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

**File:** `apps/web/src/app/business/[slug]/page.tsx`
- **Line 127:** `{ params }: Props`
- **Line 129:** `const { slug } = await params;`
- **Pattern:** Correctly awaiting params
- **Status:** ✅ Already compatible

#### Files with SearchParams Usage (May Need Updates)

**File:** `apps/web/src/app/search/page.tsx`
- **Lines 14-17:** Direct searchParams.get() calls
- **Pattern:** Using useSearchParams() hook (client-side)
- **Status:** ⚠️ May need review for server components

**File:** `apps/web/src/app/auth/login/page.tsx`
- **Line 12:** `const redirectUrl = searchParams.get('redirect');`
- **Pattern:** Using useSearchParams() hook (client-side)
- **Status:** ⚠️ May need review for server components

**File:** `apps/web/src/app/auth/register/page.tsx`
- **Line 13:** `const redirectUrl = searchParams.get('redirect');`
- **Pattern:** Using useSearchParams() hook (client-side)
- **Status:** ⚠️ May need review for server components

**File:** `apps/web/src/app/business/dashboard/reviews/page.tsx`
- **Line 48:** `const initialFilter = searchParams.get('filter')`
- **Pattern:** Using useSearchParams() hook (client-side)
- **Status:** ⚠️ May need review for server components

### 2. Manager Application (`apps/manager`)

#### Files with Direct Params Access (CRITICAL - Need Immediate Fix)

**File:** `apps/manager/src/app/dashboard/businesses/[id]/edit/page.tsx`
- **Line 64:** `const params = useParams();`
- **Line 65:** `const businessId = String((params as any)?.id ?? '');`
- **Pattern:** Using useParams() hook with type assertion
- **Impact:** Type safety issues and potential runtime errors
- **Status:** 🔴 Needs update to use React.use() pattern

#### Files with URLSearchParams Usage (No Changes Needed)

**File:** `apps/manager/src/app/dashboard/businesses/page.tsx`
- **Lines 67-75:** `const params = new URLSearchParams({...})`
- **Pattern:** Creating URLSearchParams for API calls
- **Status:** ✅ Not related to Next.js params

**File:** `apps/manager/src/app/dashboard/agents/page.tsx`
- **Lines 54-62:** `const params = new URLSearchParams({...})`
- **Pattern:** Creating URLSearchParams for API calls
- **Status:** ✅ Not related to Next.js params

### 3. Agent Application (`apps/agent`)

#### Files with URLSearchParams Usage (No Changes Needed)

**File:** `apps/agent/src/app/dashboard/commissions/page.tsx`
- **Lines 52-56:** `const params = new URLSearchParams({...})`
- **Pattern:** Creating URLSearchParams for API calls
- **Status:** ✅ Not related to Next.js params

### 4. Admin Application (`apps/admin`)

#### Files with Direct Params Access (CRITICAL - Need Immediate Fix)

**File:** `apps/admin/src/app/(dashboard)/governorates/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 11:** `const params = useParams<{ id: string }>();`
- **Line 12:** `const id = typeof params?.id === 'string' ? params.id : '';`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/packages/[id]/edit/page.tsx`
- **Line 4:** `import { useRouter, useParams } from 'next/navigation';`
- **Line 57:** `const params = useParams();`
- **Line 59:** `const id = String(params?.id ?? '');`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/districts/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 10:** `const params = useParams();`
- **Line 12:** `const id = String((params as any)?.id ?? '');`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/pages/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 10:** `const params = useParams<{ id: string }>();`
- **Line 12:** `const id = params?.id;`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/users/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 11:** `const params = useParams<{ id: string }>();`
- **Line 12:** `const id = typeof params?.id === 'string' ? params.id : '';`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/ads/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 22:** `const params = useParams<{ id: string }>();`
- **Line 23:** `const id = typeof params?.id === 'string' ? params.id : '';`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/renewals/[id]/page.tsx`
- **Line 4:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 64:** `const params = useParams();`
- **Line 66:** `const id = params.id as string;`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/categories/[id]/edit/page.tsx`
- **Line 5:** `import { useParams, useRouter } from 'next/navigation';`
- **Line 67:** `const params = useParams<{ id: string }>();`
- **Line 68:** `const categoryId = typeof params?.id === 'string' ? params.id : '';`
- **Pattern:** Using useParams() hook with type assertion
- **Status:** 🔴 Needs update to use React.use() pattern

**File:** `apps/admin/src/app/(dashboard)/businesses/[id]/page.tsx`
- **Line 5:** `import { useParams } from 'next/navigation';`
- **Pattern:** Using useParams() hook (need to check implementation)
- **Status:** 🔴 Needs review and likely update

#### Files with SearchParams Usage (May Need Updates)

**File:** `apps/admin/src/app/(dashboard)/districts/new/page.tsx`
- **Line 5:** `import { useRouter, useSearchParams } from 'next/navigation';`
- **Line 12:** `const searchParams = useSearchParams();`
- **Lines 13-14:** Direct searchParams.get() calls
- **Status:** ⚠️ May need review for server components

**File:** `apps/admin/src/app/(dashboard)/cities/new/page.tsx`
- **Line 5:** `import { useRouter, useSearchParams } from 'next/navigation';`
- **Line 11:** `const searchParams = useSearchParams();`
- **Line 12:** Direct searchParams.get() calls
- **Status:** ⚠️ May need review for server components

**File:** `apps/admin/src/app/(dashboard)/categories/new/page.tsx`
- **Line 5:** `import { useRouter, useSearchParams } from 'next/navigation';`
- **Line 30:** `const searchParams = useSearchParams();`
- **Line 31:** Direct searchParams.get() calls
- **Status:** ⚠️ May need review for server components

## Summary of Required Changes

### Critical Issues (Must Fix)
1. **`apps/web/src/app/dashboard/business/[id]/edit/page.tsx`**
   - Change params type from `{ id: string }` to `Promise<{ id: string }>`
   - Add `const { id } = React.use(params);` at component start
   - Update all `params.id` references to use resolved `id`

2. **`apps/web/src/app/dashboard/business/[id]/analytics/page.tsx`**
   - Change params type from `{ id: string }` to `Promise<{ id: string }>`
   - Add `const { id } = React.use(params);` at component start
   - Update all `params.id` references to use resolved `id`

3. **`apps/manager/src/app/dashboard/businesses/[id]/edit/page.tsx`**
   - Replace `useParams()` hook with proper params prop
   - Change to server component or use React.use() pattern
   - Update type definitions

4. **`apps/manager/src/app/dashboard/agents/[id]/page.tsx`**
   - Replace `useParams()` hook with proper params prop
   - Change to server component or use React.use() pattern
   - Update type definitions

5. **Admin Application - 9 Files with useParams() Usage:**
   - `apps/admin/src/app/(dashboard)/governorates/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/packages/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/districts/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/pages/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/users/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/ads/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/renewals/[id]/page.tsx`
   - `apps/admin/src/app/(dashboard)/categories/[id]/edit/page.tsx`
   - `apps/admin/src/app/(dashboard)/businesses/[id]/page.tsx`
   - **All need:** Replace useParams() with proper params prop and React.use() pattern

### Files Already Compatible
- `apps/web/src/app/district/[slug]/page.tsx` ✅
- `apps/web/src/app/governorate/[slug]/page.tsx` ✅
- `apps/web/src/app/city/[slug]/page.tsx` ✅
- `apps/web/src/app/category/[slug]/page.tsx` ✅
- `apps/web/src/app/subcategory/[slug]/page.tsx` ✅
- `apps/web/src/app/business/[slug]/page.tsx` ✅

### Files Needing Review
- SearchParams usage in client components may need updates if converted to server components

## Implementation Priority

1. **High Priority:** Fix the 13 critical files with direct params access:
   - 2 files in web app (immediate runtime errors)
   - 2 files in manager app (useParams issues)
   - 9 files in admin app (useParams issues)
2. **Medium Priority:** Review searchParams usage patterns
3. **Low Priority:** Add comprehensive testing for all dynamic routes

## Testing Strategy

Each fixed component should be tested to ensure:
1. Params are properly resolved using React.use()
2. Loading states are handled during params resolution
3. Error boundaries catch params resolution failures
4. All useQuery hooks work with resolved params
5. Navigation between dynamic routes works correctly

## Type Definitions Needed

```typescript
// For server components
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// For client components using React.use()
interface ClientPageProps {
  params: Promise<{ id: string }>;
}
```

## Total Files Requiring Updates

- **Critical (Direct params access):** 13 files
- **Review needed (SearchParams):** 6+ files
- **Already compatible:** 6 files
- **Total dynamic routes identified:** 19+ files