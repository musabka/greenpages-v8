# Requirements Document

## Introduction

The agent portal service has TypeScript compilation errors due to missing database models and fields in the Prisma schema. The code is attempting to use database entities and fields that don't exist in the current schema, causing the application to fail compilation.

## Glossary

- **Agent_Portal_Service**: The NestJS service that handles agent portal functionality
- **Prisma_Schema**: The database schema definition file that generates TypeScript types
- **Invoice_Model**: A database model for storing invoice information
- **Business_Package**: A database model linking businesses to their subscription packages
- **Agent_Collection**: A database model for tracking agent cash collections
- **Agent_Commission**: A database model for tracking agent commissions
- **Renewal_Contact**: A database model for tracking renewal contact attempts
- **Renewal_Record**: A database model for tracking business renewal processes

## Requirements

### Requirement 1: Invoice Model Creation

**User Story:** As a developer, I want to have an Invoice model in the database, so that the agent portal can create and track invoices for business subscriptions.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL include an Invoice model with all required fields
2. WHEN an invoice is created, THE Invoice_Model SHALL store invoice number, customer, business, type, status, amounts, and line items
3. THE Invoice_Model SHALL support relationships to Business, User (customer), and InvoiceLine models
4. THE Invoice_Model SHALL include audit fields (createdAt, updatedAt, createdById)

### Requirement 2: Business Package Payment Status

**User Story:** As an agent, I want to track payment status for business packages, so that I can know which subscriptions are paid or pending payment.

#### Acceptance Criteria

1. THE Business_Package SHALL include a paymentStatus field
2. WHEN a business package is created with cash payment, THE Business_Package SHALL set paymentStatus to 'PENDING'
3. WHEN a business package is created with wallet payment, THE Business_Package SHALL set paymentStatus to 'PAID'
4. THE Business_Package SHALL support payment status values: PENDING, PAID, FAILED, REFUNDED

### Requirement 3: Agent Collection Invoice Reference

**User Story:** As an agent, I want to link cash collections to invoices, so that I can track which collections correspond to which invoices.

#### Acceptance Criteria

1. THE Agent_Collection SHALL include an invoiceId field
2. WHEN an agent collects cash for a subscription, THE Agent_Collection SHALL reference the related invoice
3. THE Agent_Collection SHALL maintain a foreign key relationship to the Invoice model
4. THE Agent_Collection SHALL allow null invoiceId for collections not related to invoices

### Requirement 4: Agent Commission Amount Field

**User Story:** As a system administrator, I want to track commission amounts separately from subscription amounts, so that I can properly calculate agent earnings.

#### Acceptance Criteria

1. THE Agent_Commission SHALL include an amount field for the base transaction amount
2. WHEN a commission is created, THE Agent_Commission SHALL store both the original amount and calculated commission
3. THE Agent_Commission SHALL maintain separate fields for amount and commissionAmount
4. THE Agent_Commission SHALL calculate commissionAmount based on amount and commissionRate

### Requirement 5: Renewal Contact Method Field

**User Story:** As an agent, I want to record the contact method used for renewal attempts, so that I can track communication history effectively.

#### Acceptance Criteria

1. THE Renewal_Contact SHALL include a method field for contact method
2. WHEN a renewal contact is recorded, THE Renewal_Contact SHALL specify the contact method used
3. THE Renewal_Contact SHALL support contact methods: PHONE, VISIT, EMAIL, SMS
4. THE Renewal_Contact SHALL validate that method is one of the allowed values

### Requirement 6: Renewal Record Decision Field

**User Story:** As an agent, I want to record renewal decisions, so that I can track the outcome of renewal attempts.

#### Acceptance Criteria

1. THE Renewal_Record SHALL include a decision field for renewal outcomes
2. WHEN a renewal decision is made, THE Renewal_Record SHALL store the decision value
3. THE Renewal_Record SHALL support decision values: RENEW, DECLINE, POSTPONE
4. THE Renewal_Record SHALL allow updating the decision field after initial creation

### Requirement 7: Invoice Line Items

**User Story:** As a developer, I want to store detailed line items for invoices, so that invoices can contain multiple products or services.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL include an InvoiceLine model
2. WHEN an invoice is created with line items, THE InvoiceLine SHALL store description, quantity, unit price, and total
3. THE InvoiceLine SHALL maintain a foreign key relationship to the Invoice model
4. THE InvoiceLine SHALL support multiple line items per invoice

### Requirement 8: Database Migration Compatibility

**User Story:** As a system administrator, I want database changes to be applied safely, so that existing data is preserved during schema updates.

#### Acceptance Criteria

1. WHEN new fields are added to existing models, THE migration SHALL provide default values
2. WHEN new models are created, THE migration SHALL create all necessary indexes
3. THE migration SHALL maintain referential integrity for all foreign key relationships
4. THE migration SHALL be reversible in case of rollback requirements