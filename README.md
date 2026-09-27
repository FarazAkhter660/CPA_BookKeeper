# Loopnow CPA Copilot

AI-powered Canadian bookkeeping and GST/HST compliance agent for processing receipts and calculating Input Tax Credits (ITCs).

## Product Overview

Loopnow CPA Copilot is a production-grade AI agent that automates Canadian corporate bookkeeping with strict CRA compliance. The system processes receipts, validates documentation, calculates eligible GST/HST ITCs, and maps expenses to CRA GIFI codes using deterministic business logic rather than LLM hallucination.

**Key Features:**
- Deterministic CRA compliance engine (ITC calculations, documentation tiers, meals/entertainment rules)
- Controlled GIFI code catalogue with validation
- Prompt injection resistance and security boundaries
- Comprehensive audit trail with rule versioning
- App-aware agent with bidirectional state synchronization
- Real-time tool execution visibility
- Human-in-the-loop approval for ambiguous cases

## Architecture

The system follows a layered architecture separating concerns between the LLM (interpretation/planning) and deterministic business logic (calculations/validation):

```
┌─────────────────────────────────────────────────────────────┐
│                      React Dashboard UI                       │
│  (Queue, Receipt Details, AI Copilot with streaming)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Runtime (AI SDK)                     │
│  - Multi-step execution loop                                 │
│  - Tool selection and orchestration                           │
│  - Streaming responses                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Tools (Zod)                         │
│  - get_current_receipt                                       │
│  - validate_cra_documentation                                │
│  - calculate_eligible_itc                                    │
│  - assign_gifi_code                                         │
│  - update_expense_classification                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Deterministic Domain Layer                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ CRA Rules   │  │ GIFI Engine │  │ Money Safe  │         │
│  │ - ITC Calc  │  │ - Catalogue │  │ - Decimal   │         │
│  │ - Docs      │  │ - Mapping   │  │ - Precision │         │
│  │ - GST/HST   │  │ - Validation│  │             │         │
│  │ - Meals     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Persistence & Audit Layer                       │
│  - In-memory database (prototype)                           │
│  - Audit event logging                                       │
│  - Rule version tracking                                     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS
- **AI SDK:** Vercel AI SDK
- **Validation:** Zod
- **Money Calculations:** Decimal.js
- **Database:** In-memory (prototype) / PostgreSQL (production-ready schema)
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React

## Agent Architecture

The agent is designed as a **tool-using, stateful, app-aware system** rather than a chatbot wrapper:

### Multi-Step Execution Loop

1. **Read Application State** - Agent accesses current selected receipt
2. **Retrieve Receipt Details** - Get full receipt data
3. **Validate Documentation** - Apply CRA documentation tier rules
4. **Validate GST/HST Number** - Format validation (not external verification)
5. **Calculate ITC** - Deterministic calculation using rules engine
6. **Classify Expense** - Determine category and meal/entertainment status
7. **Map GIFI** - Assign controlled GIFI code with validation
8. **Self-Verification** - Validate result before reporting
9. **Update State** - Persist classification to database
10. **Generate Explanation** - Provide auditable reasoning
11. **Audit Event** - Log all actions with rule version

### State Architecture

**UI-Owned State:**
- Selected receipt ID
- Active tab/drawer
- Viewport state

**Agent-Owned State:**
- Processing stage
- Classification result
- Compliance findings
- Tool execution state

**Persisted Domain State:**
- Receipt records
- Bookkeeping classifications
- Audit events
- Approval decisions

## Tool Architecture

All tools use strict Zod schemas and return structured results:

```typescript
// Example: calculate_eligible_itc
{
  inputSchema: z.object({
    receiptId: z.string(),
    taxAmount: z.number().nonnegative(),
    eligibilityPercentage: z.number().min(0).max(1),
    documentationStatus: z.enum(["sufficient", "insufficient", "review"])
  }),
  execute: async (input) => {
    // Deterministic calculation by CRA rules engine
    return {
      grossTax: Money,
      eligibilityPercentage: number,
      eligibleITC: Money,
      reasonCode: string,
      status: "eligible" | "partial" | "ineligible" | "review",
      documentation: { tier, status },
      source: "CRA_RULE_ENGINE"
    };
  }
}
```

**Available Tools:**
- `get_current_receipt` - Get currently selected receipt
- `get_receipt_details` - Get full receipt data
- `validate_cra_documentation` - Validate documentation requirements
- `validate_gst_hst_number` - Validate GST/HST number format
- `calculate_eligible_itc` - Calculate ITC deterministically
- `classify_expense` - Classify expense category
- `assign_gifi_code` - Map to controlled GIFI catalogue
- `update_expense_classification` - Persist classification
- `request_human_review` - Request approval for ambiguous cases
- `get_processing_status` - Get current processing state

## CRA Rule Engine

### Documentation Tiers

Based on CRA GST/HST Memorandum 1.4:

- **Tier 1** (< $30): Basic documentation (vendor, date, amount)
- **Tier 2** ($30 - $149.99): Additional GST/HST number and description required
- **Tier 3** ($150+): Complete documentation including customer information

### ITC Calculation

Deterministic calculation considering:
- Commercial use percentage
- Meal/entertainment restrictions (50% standard, with exceptions)
- Documentation sufficiency
- Tax type (GST vs HST)

**Example:**
```typescript
ITCRules.calculateEligibleITC({
  subtotal: Money.fromNumber(240),
  taxAmount: Money.fromNumber(12),
  taxType: TaxType.GST,
  expenseCategory: "Business meal",
  commercialUsePercentage: 100,
  mealEntertainment: true,
  documentationStatus: DocumentationStatus.SUFFICIENT,
  documentationTier: DocumentationTier.TIER_2,
  mealPolicyType: 'standard'
});
// Returns: eligibleITC = $6.00 (50% of $12.00)
```

### GST/HST Number Validation

Format validation only (not external CRA registration verification):
- Pattern: 9 digits + RT + 4 digits (e.g., 123456789RT0001)
- Distinguishes: valid format, invalid format, missing, malformed, suspicious

### Meals & Entertainment

Deterministic policy:
- Standard: 50% ITC
- Charity/public institution: 100% ITC
- Long-haul truck driver: 80% ITC

## GIFI Engine

Controlled catalogue of CRA GIFI codes with:

- **Code validation** - Only codes in catalogue are accepted
- **Confidence scoring** - Low confidence triggers review
- **Ambiguity detection** - Multiple matches require human review
- **Mapping logic** - Deterministic matching based on description

**Sample GIFI Codes:**
- 1001 — Cash
- 8810 — Office expenses
- 8523 — Meals and entertainment
- 8860 — Rent
- 8880 — Utilities

## Security Model

### Prompt Injection Resistance

All receipt data is treated as untrusted:
- Input sanitization removes control characters
- Pattern detection identifies injection attempts
- Receipt text never executed as instructions
- Vendor descriptions, OCR text, notes are sanitized

**Detection Patterns:**
- "Ignore all instructions"
- "Override rules"
- "Reveal system prompt"
- "New instructions:"

### Security Boundaries

- **Tool allowlisting** - Only defined tools available
- **Least privilege** - No shell execution or file system access
- **Input validation** - All tool inputs validated with Zod
- **Output sanitization** - Sensitive data redacted in logs
- **Audit trail** - All actions logged with integrity hashes

### OWASP Alignment

Follows OWASP guidance for agentic systems:
- Minimal tool functionality
- Human approval for high-impact actions
- Authorization boundaries
- Untrusted output handling

## Observability

### Audit Trail

Every meaningful action generates an audit event:

```typescript
{
  eventId: "evt_123",
  timestamp: "2026-09-26T10:00:00Z",
  actor: "agent",
  receiptId: "receipt_001",
  action: "calculate_eligible_itc",
  inputHash: "abc123",
  resultHash: "def456",
  ruleVersion: "2026.09.1",
  model: "gpt-4",
  status: "success"
}
```

### Metrics Tracked

- Request ID
- Agent run ID
- Model latency
- TTFT (Time to First Token)
- Total latency
- Input/output tokens
- Tool calls and latency
- Tool errors
- Retry count

## Testing

### Unit Tests

Test deterministic business logic:
- GST/HST calculations
- ITC calculations with boundary cases ($29.99, $30.00, $30.01, $149.99, $150.00, $150.01)
- Percentage calculations (0%, 50%, 100%)
- Documentation tier validation
- GST/HST number format validation
- GIFI code validation
- Meals/entertainment rules
- Money precision and rounding

### Integration Tests

Test agent workflows:
- End-to-end receipt processing
- Tool orchestration
- State synchronization
- Error handling

### Security Tests

Test adversarial scenarios:
- Prompt injection attempts
- Tool abuse prevention
- Input validation bypasses
- Unauthorized state mutations

### Evaluation Dataset

Golden cases for agent evaluation:
- Normal cases (10+)
- Ambiguous cases (10+)
- Missing documentation (10+)
- Tax edge cases (10+)
- Prompt injection attacks (10+)
- Incorrect user instructions (10+)

## Docker Instructions

### Prerequisites

- Docker
- Docker Compose

### Running with Docker

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# MODEL_API_KEY=your_key_here

# Build and start
docker compose up --build

# Application will be available at http://localhost:3000
```

### Health Checks

```bash
# Check if application is alive
curl http://localhost:3000/api/health

# Check if application is ready
curl http://localhost:3000/api/ready
```

## Environment Variables

```bash
# Model Provider
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4
MODEL_API_KEY=your_api_key_here

# Database (production)
DATABASE_URL=postgresql://user:password@localhost:5432/cpa_bookkeeper

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# LangSmith (optional)
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=cpa-bookkeeper

# Application
NODE_ENV=development
PORT=3000
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Test with coverage
npm run test:coverage
```

## Production Considerations

### Database Migration

The prototype uses in-memory storage. For production:

1. Configure PostgreSQL connection string in `.env`
2. Run migrations: `npm run db:migrate`
3. Seed data: `npm run db:seed`

### Model Provider

The system supports multiple providers via configuration:
- OpenAI
- Anthropic
- DeepSeek
- Qwen
- Any OpenAI-compatible provider

### Scaling Considerations

- Stateless agent runtime allows horizontal scaling
- Database connection pooling
- Caching for GIFI catalogue
- Rate limiting on API endpoints
- CDN for static assets

## Known Limitations

- **Prototype Database:** Uses in-memory storage (production requires PostgreSQL)
- **No Real OCR:** Receipt images not processed (mock data only)
- **No External GST Verification:** GST number format validation only
- **Simulated Agent Runtime:** Tool execution is simulated in UI (needs AI SDK integration)
- **No Voice Interface:** Text-only (voice is optional bonus)
- **Limited Test Coverage:** Unit tests for domain logic only (needs integration/E2E tests)

## Future Improvements

- Complete AI SDK integration for real agent execution
- Add streaming tool calls and state updates
- Implement human-in-the-loop approval workflow
- Add OpenTelemetry tracing
- Create comprehensive test suite (unit, integration, E2E, security)
- Build agent evaluation dashboard
- Add receipt image/OCR pipeline
- Implement voice interface
- Add multi-model fallback
- Create persistent agent sessions
- Implement property-based testing

## Architecture Decisions

### Why Next.js + AI SDK?

- **Next.js:** Production-ready React framework with server components
- **AI SDK:** First-class support for streaming, tool calling, and state management
- **App Router:** Modern routing with built-in optimization

### Why Deterministic Business Logic?

- **Compliance:** Tax calculations must be auditable and correct
- **Safety:** LLM hallucinations could cause financial errors
- **Explainability:** Rules can be traced to specific CRA guidance
- **Versioning:** Rules can be updated without retraining models

### Why In-Memory Database for Prototype?

- **Simplicity:** No native dependency issues on Windows during development
- **Speed:** Instant startup for demonstration
- **Production-Ready:** Schema defined for easy PostgreSQL migration

### Why Strict Tool Schemas?

- **Type Safety:** Catches errors at compile time
- **Validation:** Prevents invalid data from reaching business logic
- **Documentation:** Schemas serve as executable documentation
- **Testing:** Easy to generate test cases from schemas

## CRA References

- **GST/HST Memorandum 1.4:** Supporting Documentation
- **GST/HST Memorandum 3.2:** Input Tax Credits
- **GST/HST Memorandum 3.3:** Input Tax Credits - Restrictions
- **GIFI Codes:** CRA Financial Statement Coding

## License

Proprietary - Loopnow Technologies Private Limited

## Contact

Hiring Manager: Dhiraj Chatpar
Company: Loopnow Technologies Private Limited
