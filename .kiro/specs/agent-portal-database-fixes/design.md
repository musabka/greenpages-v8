# Design Document

## Overview

This design addresses the TypeScript compilation errors in the agent portal service by adding missing database models and fields to the Prisma schema. The solution involves creating new models (Invoice, InvoiceLine) and adding missing fields to existing models (BusinessPackage, AgentCollection, AgentCommission, RenewalContact, RenewalRecord).

## Architecture

The solution follows the existing database architecture patterns:
- Uses PostgreSQL as the database engine
- Follows Prisma ORM conventions for model definitions
- Maintains referential integrity through foreign key relationships
- Uses existing enum types where applicable
- Follows the established naming conventions (snake_case for database fields, camelCase for Prisma fields)

## Components and Interfaces

### New Models

#### Invoice Model
```prisma
model Invoice {
  id              String        @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  invoiceNumber   String        @unique @map("invoice_number")
  customerId      String        @map("customer_id") @db.Uuid
  businessId      String?       @map("business_id") @db.Uuid
  invoiceType     AccInvoiceType @map("invoice_type")
  status          AccInvoiceStatus @default(DRAFT)
  subtotal        Decimal       @db.Decimal(12, 2)
  taxAmount       Decimal       @default(0) @map("tax_amount") @db.Decimal(12, 2)
  total           Decimal       @db.Decimal(12, 2)
  paidAmount      Decimal       @default(0) @map("paid_amount") @db.Decimal(12, 2)
  currency        String        @default("SYP")
  notes           String?
  dueDate         DateTime?     @map("due_date")
  issuedAt        DateTime      @default(now()) @map("issued_at")
  paidAt          DateTime?     @map("paid_at")
  createdById     String        @map("created_by_id") @db.Uuid
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  
  // Relations
  customer        User          @relation("CustomerInvoices", fields: [customerId], references: [id])
  business        Business?     @relation(fields: [businessId], references: [id])
  createdBy       User          @relation("CreatedInvoices", fields: [createdById], references: [id])
  lines           InvoiceLine[]
  collections     AgentCollection[]
  
  @@index([customerId])
  @@index([businessId])
  @@index([status])
  @@index([invoiceType])
  @@index([issuedAt])
  @@index([createdById])
  @@map("invoices")
}
```

#### InvoiceLine Model
```prisma
model InvoiceLine {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  invoiceId   String   @map("invoice_id") @db.Uuid
  description String
  quantity    Decimal  @default(1) @db.Decimal(10, 3)
  unitPrice   Decimal  @map("unit_price") @db.Decimal(12, 2)
  total       Decimal  @db.Decimal(12, 2)
  sortOrder   Int      @default(0) @map("sort_order")
  
  // Relations
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  @@index([invoiceId])
  @@map("invoice_lines")
}
```

### Model Updates

#### BusinessPackage Updates
Add the following field:
```prisma
paymentStatus   PaymentStatus @default(PENDING) @map("payment_status")
```

#### AgentCollection Updates
Add the following field:
```prisma
invoiceId       String?       @map("invoice_id") @db.Uuid
```

And relation:
```prisma
invoice         Invoice?      @relation(fields: [invoiceId], references: [id])
```

#### AgentCommission Updates
Add the following field:
```prisma
amount          Decimal       @db.Decimal(10, 2)
```

#### RenewalContact Updates
The model already has `contactMethod` field, but the code is using `method`. We need to update the service code to use the correct field name.

#### RenewalRecord Updates
Add the following field:
```prisma
decision        RenewalDecision? @map("decision")
```

### User Model Updates
Add new relations for invoices:
```prisma
customerInvoices    Invoice[]     @relation("CustomerInvoices")
createdInvoices     Invoice[]     @relation("CreatedInvoices")
```

## Data Models

### Invoice Data Flow
1. Agent creates a business package renewal
2. System generates an invoice with line items
3. Invoice is linked to the business and customer
4. If payment method is CASH, agent collection is created with invoice reference
5. Invoice status is updated based on payment method

### Payment Status Flow
1. BusinessPackage created with CASH payment → paymentStatus = PENDING
2. BusinessPackage created with WALLET payment → paymentStatus = PAID
3. Agent collects cash → AgentCollection created with invoice reference
4. System can track which collections correspond to which invoices

### Commission Calculation Flow
1. Business package is created with price (amount)
2. Commission is calculated: commissionAmount = amount * commissionRate / 100
3. Both original amount and calculated commission are stored
4. Agent earnings can be properly tracked and audited

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invoice Creation Completeness
*For any* invoice created in the system, it should store all required fields including invoice number, customer, business, type, status, amounts, and line items
**Validates: Requirements 1.2**

### Property 2: Payment Status Assignment
*For any* business package created, if the payment method is CASH then payment status should be PENDING, and if payment method is WALLET then payment status should be PAID
**Validates: Requirements 2.2, 2.3**

### Property 3: Agent Collection Invoice Reference
*For any* agent collection created for a cash payment, it should reference a valid invoice ID that exists in the invoice table
**Validates: Requirements 3.2**

### Property 4: Commission Field Storage
*For any* agent commission created, it should store both the original transaction amount and the calculated commission amount
**Validates: Requirements 4.2**

### Property 5: Commission Calculation Accuracy
*For any* agent commission record, the commission amount should equal the base amount multiplied by the commission rate divided by 100
**Validates: Requirements 4.4**

### Property 6: Renewal Contact Method Recording
*For any* renewal contact recorded, it should specify a valid contact method from the allowed values
**Validates: Requirements 5.2**

### Property 7: Renewal Decision Management
*For any* renewal record, when a decision is made it should be properly stored and should be updatable after initial creation
**Validates: Requirements 6.2, 6.4**

### Property 8: Invoice Line Completeness
*For any* invoice line created, it should store all required fields including description, quantity, unit price, and total
**Validates: Requirements 7.2**

### Property 9: Foreign Key Integrity
*For any* record with foreign key relationships, all referenced IDs should exist in their respective tables
**Validates: Requirements 8.3**

## Error Handling

### Migration Errors
- If migration fails due to existing data conflicts, provide clear error messages
- Ensure all new fields have appropriate default values
- Handle cases where existing records need to be updated

### Data Validation Errors
- Validate that invoice totals are calculated correctly
- Ensure payment status values are within allowed enum values
- Validate that commission calculations don't result in negative values

### Referential Integrity Errors
- Handle cases where referenced entities (customers, businesses) don't exist
- Provide meaningful error messages for foreign key constraint violations
- Ensure cascading deletes work correctly for related records

## Testing Strategy

### Unit Tests
- Test individual model validations
- Test enum value constraints
- Test default value assignments
- Test foreign key relationship creation

### Property-Based Tests
- Test invoice number uniqueness across large datasets
- Test payment status assignment logic with various payment methods
- Test commission calculation accuracy with different rates and amounts
- Test invoice total calculations with various line item combinations

### Integration Tests
- Test complete invoice creation flow from agent portal
- Test business package creation with different payment methods
- Test agent collection creation with invoice references
- Test database migration execution and rollback

### Database Migration Tests
- Test migration execution on empty database
- Test migration execution on database with existing data
- Test migration rollback functionality
- Test index creation and performance impact