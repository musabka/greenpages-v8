# Implementation Plan: Next.js Params Fix

## Overview

This implementation plan systematically fixes the Next.js 15+ params compatibility issues across all applications by updating components to use React.use() for unwrapping params promises. The approach ensures no functionality is lost while maintaining performance and adding proper error handling.

## Tasks

- [x] 1. Identify and catalog affected components
  - Scan all Next.js applications (admin, agent, manager, web) for direct params access
  - Create list of files that need updating with line numbers
  - Document current param usage patterns in each component
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Set up testing infrastructure
  - [ ] 2.1 Install and configure property-based testing framework
    - Add @fast-check/jest dependency to package.json
    - Configure Jest to work with property-based tests
    - Set up test utilities for React component testing with async params
    - _Requirements: 6.5_

  - [ ]* 2.2 Create test utilities for params testing
    - Write helper functions for creating params promises
    - Create mock components for testing params unwrapping
    - Set up error boundary test utilities
    - _Requirements: 4.2, 6.5_

- [ ] 3. Update TypeScript types and interfaces
  - [ ] 3.1 Update page props interfaces across all apps
    - Change params from synchronous objects to Promise<T>
    - Update searchParams to be Promise-based where needed
    - Create utility types for resolved params
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.2 Write property test for type safety
    - **Property 1: Params unwrapping and resolution**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 4. Fix business edit page (immediate error)
  - [ ] 4.1 Update EditBusinessPage component
    - Replace direct params.id access with React.use(params)
    - Update useQuery to use resolved params
    - Add proper loading state while params resolve
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [ ]* 4.2 Write property test for business edit functionality
    - **Property 4: Functionality preservation**
    - **Validates: Requirements 2.4**

- [ ] 5. Update admin application components
  - [ ] 5.1 Fix all admin dynamic route pages
    - Update all [id] route pages to use React.use()
    - Update all [...slug] and [[...slug]] route pages
    - Ensure all useQuery hooks use resolved params
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ]* 5.2 Write property test for admin app functionality
    - **Property 7: Application-level functionality preservation**
    - **Validates: Requirements 6.1**

- [ ] 6. Update agent application components
  - [ ] 6.1 Fix all agent dynamic route pages
    - Update agent dashboard dynamic routes
    - Fix agent profile and settings pages
    - Update any business-related dynamic routes
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ]* 6.2 Write property test for agent app functionality
    - **Property 7: Application-level functionality preservation**
    - **Validates: Requirements 6.2**

- [ ] 7. Update manager application components
  - [ ] 7.1 Fix all manager dynamic route pages
    - Update manager dashboard dynamic routes
    - Fix manager reporting and analytics pages
    - Update team management dynamic routes
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ]* 7.2 Write property test for manager app functionality
    - **Property 7: Application-level functionality preservation**
    - **Validates: Requirements 6.3**

- [ ] 8. Update web application components
  - [ ] 8.1 Fix all web app dynamic route pages
    - Update public-facing dynamic routes
    - Fix product/service detail pages
    - Update category and search result pages
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ]* 8.2 Write property test for web app functionality
    - **Property 7: Application-level functionality preservation**
    - **Validates: Requirements 6.4**

- [ ] 9. Implement error handling and loading states
  - [ ] 9.1 Add error boundaries for params resolution
    - Create ParamsErrorBoundary component
    - Wrap all dynamic route pages with error boundaries
    - Implement fallback UI for params resolution failures
    - _Requirements: 4.2, 5.1_

  - [ ] 9.2 Add loading states for params resolution
    - Implement loading indicators while params resolve
    - Ensure smooth transitions from loading to content
    - Handle edge cases where params take time to resolve
    - _Requirements: 4.1, 4.3_

  - [ ]* 9.3 Write property tests for error handling
    - **Property 5: Loading state handling**
    - **Property 6: Error handling for params resolution**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 10. Update React Query and hook integrations
  - [ ] 10.1 Fix all useQuery implementations
    - Update queryKey arrays to use resolved params
    - Update queryFn functions to use resolved params
    - Ensure proper dependency tracking for param changes
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 10.2 Write property test for hook integration
    - **Property 2: Hook integration with resolved params**
    - **Property 3: Hook reactivity to param changes**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 11. Checkpoint - Test all applications
  - Ensure all applications start without TypeScript errors
  - Verify all dynamic routes load without runtime errors
  - Test navigation between dynamic routes works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Performance optimization and final testing
  - [ ] 12.1 Optimize component re-renders
    - Review components for unnecessary re-renders due to params changes
    - Add proper memoization where needed
    - Ensure React.use() doesn't impact performance
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ]* 12.2 Run comprehensive property-based tests
    - Execute all property tests with 100+ iterations each
    - Verify no regression issues exist
    - Test edge cases and error conditions
    - _Requirements: 6.5_

- [ ] 13. Final checkpoint - Complete system verification
  - Run full test suite across all applications
  - Verify TypeScript compilation succeeds
  - Test production builds work correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on one application at a time to ensure systematic coverage
- The business edit page fix (Task 4) addresses the immediate error reported