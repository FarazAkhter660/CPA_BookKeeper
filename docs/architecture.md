# Architecture Documentation

## Overview

Loopnow CPA Copilot is a production-grade AI agent system for Canadian bookkeeping and GST/HST compliance. The architecture separates LLM capabilities (interpretation, planning, natural language) from deterministic business logic (calculations, validation, compliance).

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Receipt Queue │  │Receipt Details│  │ AI Copilot   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application State Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AppState (React)                                         │   │
│  │ - selectedReceiptId                                     │   │
│  │ - receipts[]                                            │   │
│  │ - processingStatus                                     │   │
│  │ - currentAnalysis                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Agent Runtime Layer                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI SDK (Vercel)                                          │   │
│  │ - Tool orchestration                                    │   │
│  │ - Streaming responses                                   │   │
│  │ - State synchronization                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent Tools (Zod-validated)                             │   │
│  │ - get_current_receipt                                   │   │
│  │ - validate_cra_documentation                            │   │
│  │ - calculate_eligible_itc                                │   │
│  │ - assign_gifi_code                                      │   │
│  │ - update_expense_classification                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Logic Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ CRA Rules   │  │ GIFI Engine │  │ Money Safe  │             │
│  │             │  │             │  │             │             │
│  │ - ITC Calc  │  │ - Catalogue │  │ - Decimal   │             │
│  │ - Docs      │  │ - Mapping   │  │ - Precision │             │
│  │ - GST/HST   │  │ - Validation│  │ - Rounding  │             │
│  │ - Meals     │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Persistence & Audit Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ In-Memory Database (prototype) / PostgreSQL (prod)       │   │
│  │ - receipts                                              │   │
│  │ - expenses                                              │   │
│  │ - audit_events                                         │   │
│  │ - approvals                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Audit Logger                                            │   │
│  │ - Event logging with integrity hashes                   │   │
│  │ - Rule version tracking                                 │   │
│  │ - Source attribution                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Presentation Layer

**Technologies:** Next.js 15, React, TailwindCSS, Radix UI

**Components:**
- **ReceiptQueue:** Displays list of receipts with status indicators
- **ReceiptDetails:** Shows selected receipt information and classification
- **AICopilot:** Chat interface for agent interaction with tool execution visibility

**State Management:**
- React state for UI-owned data (selected receipt, viewport)
- Agent state for processing status and tool execution
- Persisted domain state for receipts and classifications

### Agent Runtime Layer

**Technology:** Vercel AI SDK

**Responsibilities:**
- Tool selection and orchestration
- Multi-step execution loop
- Streaming responses (tokens, tool calls, state)
- Error handling and retries
- State synchronization with UI

**Tool Architecture:**
All tools follow strict contract pattern:
```typescript
{
  description: string,
  inputSchema: z.Schema,
  execute: async (input) => Result
}
```

**Tool Categories:**
1. **State Access:** `get_current_receipt`, `get_receipt_details`, `get_processing_status`
2. **Validation:** `validate_cra_documentation`, `validate_gst_hst_number`
3. **Calculation:** `calculate_eligible_itc`
4. **Classification:** `classify_expense`, `assign_gifi_code`
5. **Mutation:** `update_expense_classification`
6. **Review:** `request_human_review`

### Domain Logic Layer

**Design Principle:** All financial calculations and compliance decisions are deterministic. The LLM is used for interpretation and planning only.

#### CRA Rules Engine

**Location:** `src/domain/cra/`

**Modules:**
- `documentation-rules.ts`: CRA documentation tier validation
- `gst-hst-rules.ts`: GST/HST number format validation
- `itc-rules.ts`: Input tax credit calculation
- `meals-rules.ts`: Meals/entertainment ITC restrictions

**Key Features:**
- Rule versioning (CRA_RULESET_VERSION = '2026.09.1')
- Source attribution to CRA memoranda
- Deterministic calculations using Decimal.js
- Validation of all results

#### GIFI Engine

**Location:** `src/domain/gifi/`

**Modules:**
- `gifi-catalogue.ts`: Controlled GIFI code catalogue
- `gifi-mapper.ts`: Expense description to GIFI mapping

**Key Features:**
- Controlled catalogue (no arbitrary codes)
- Confidence scoring
- Ambiguity detection
- Validation against catalogue

#### Money Safe

**Location:** `src/domain/money/`

**Technology:** Decimal.js for precision

**Key Features:**
- Avoids floating-point errors
- Canadian rounding rules
- Percentage calculations
- Currency formatting

### Persistence Layer

**Prototype:** In-memory database (Map-based)
**Production:** PostgreSQL (schema defined in `src/db/schema/`)

**Entities:**
- `receipts`: Receipt data and status
- `expenses`: Classification and ITC results
- `audit_events`: Audit trail with integrity hashes
- `approvals`: Human review requests
- `agent_runs`: Agent execution metadata
- `tool_calls`: Tool execution details

**Rationale for In-Memory Prototype:**
- Avoids native dependency issues on Windows
- Instant startup for demonstration
- Production-ready schema for easy migration

### Security Layer

**Location:** `src/lib/security/`

**Features:**
- Input sanitization (control characters, length limits)
- Prompt injection pattern detection
- Sensitive data redaction in logs
- HTML escaping for display

**Detection Patterns:**
- "Ignore all instructions"
- "Override rules"
- "Reveal system prompt"
- "New instructions:"

### Audit Layer

**Location:** `src/lib/audit/`

**Features:**
- Structured event logging
- Input/result hashing for integrity
- Rule version tracking
- Source attribution
- Sensitive data redaction

**Event Types:**
- Receipt operations
- Validation steps
- Calculations
- Classifications
- Tool executions
- Errors

## State Architecture

### State Ownership Model

**UI-Owned State (React):**
- Selected receipt ID
- Active tab/drawer
- Viewport state
- Input field values

**Agent-Owned State:**
- Processing stage (idle → reading → validating → calculating → complete)
- Classification result
- Compliance findings
- Tool execution state

**Persisted Domain State:**
- Receipt records
- Bookkeeping classifications
- Audit events
- Approval decisions

### State Synchronization

**Pattern:** Bidirectional via AI SDK

```
User Action → UI State → Agent Runtime → Tools → Domain Logic → Persistence
     ↑                                                                      ↓
     └────────────────────────── UI Update ←────────────────────────────┘
```

**Streaming:**
- Token streaming for text responses
- Tool call streaming for execution visibility
- State update streaming for real-time UI updates

## Tool Execution Flow

```
1. User Request
   ↓
2. Agent reads application state (selectedReceiptId)
   ↓
3. Agent calls get_current_receipt()
   ↓
4. Agent calls validate_cra_documentation()
   ↓
5. Agent calls validate_gst_hst_number()
   ↓
6. Agent calls calculate_eligible_itc()
   ↓
7. Agent calls classify_expense()
   ↓
8. Agent calls assign_gifi_code()
   ↓
9. Self-verification (deterministic validation)
   ↓
10. Agent calls update_expense_classification()
    ↓
11. Audit event logged
    ↓
12. UI state updated
    ↓
13. Agent generates explanation
```

## Error Handling Strategy

### Model Failure
- Detect malformed tool arguments
- Reject invalid structured output
- Fallback to error state
- Log error with audit trail

### Tool Failure
- Catch exceptions in tool execution
- Return structured error response
- Agent retries if appropriate
- Log error details

### Database Failure
- Detect connection issues
- Return error to UI
- Do not report success
- Log for investigation

### Stream Interruption
- Detect disconnection
- Allow resume where possible
- Show connection status to user
- Log interruption

## Security Architecture

### Threat Model

See `docs/threat-model.md` for detailed threat analysis.

### Mitigations

**Prompt Injection:**
- Input sanitization
- Pattern detection
- Receipt data treated as untrusted
- No execution of receipt text as instructions

**Excessive Agency:**
- Tool allowlisting
- No shell execution
- No file system access
- Least privilege design

**Tool Abuse:**
- Strict input validation (Zod)
- Output validation
- Idempotent mutations
- Audit logging

**Data Exfiltration:**
- No external tool calls to arbitrary URLs
- Controlled API endpoints
- Sensitive data redaction

**Credential Leakage:**
- No API keys in client bundles
- Server-side secret handling
- Environment variables only

## Observability

### Metrics Collected

**Agent Metrics:**
- Request ID
- Agent run ID
- Model used
- TTFT (Time to First Token)
- Total latency
- Input/output tokens
- Tool call count
- Tool errors
- Retry count

**Tool Metrics:**
- Tool name
- Input/output
- Latency
- Success/failure
- Error details

**Business Metrics:**
- Receipts processed
- ITC amounts claimed
- Review requests
- Approval rate

### Tracing

**Implementation:** OpenTelemetry-compatible instrumentation

**Spans:**
- Agent run
- Each tool call
- Database operations
- External API calls

**Attributes:**
- receiptId
- ruleVersion
- model
- status

## Performance Considerations

### Optimization Strategies

**Database:**
- Connection pooling
- Query optimization
- Indexing on frequently queried fields

**Caching:**
- GIFI catalogue (static)
- CRA rules (static)
- Receipt data (short-term)

**Streaming:**
- Token-by-token response
- Progressive tool result updates
- State update streaming

### Benchmarks

**Target Metrics:**
- TTFT: < 500ms
- Tool latency: < 100ms (local), < 1s (external)
- Total agent duration: < 5s for typical receipt
- UI responsiveness: < 100ms for state updates

## Scalability Strategy

### Horizontal Scaling

**Stateless Components:**
- Agent runtime (no session state)
- API endpoints
- Static assets

**Stateful Components:**
- Database (PostgreSQL with read replicas)
- Cache (Redis for session data)

### Database Scaling

**Read Replicas:**
- Dashboard queries
- Audit log reads
- Report generation

**Write Scaling:**
- Connection pooling
- Batch inserts for audit events
- Optimistic locking for updates

## Technology Decisions

### Next.js + AI SDK

**Rationale:**
- Production-ready React framework
- Built-in optimization
- AI SDK provides first-class streaming and tool calling
- Strong TypeScript support

### Deterministic Business Logic

**Rationale:**
- Compliance requires accuracy
- LLM hallucinations unacceptable for financial calculations
- Auditability requires traceable rules
- Version control for regulatory changes

### In-Memory Database (Prototype)

**Rationale:**
- Avoids native dependency issues on Windows
- Instant startup for demonstration
- Production-ready schema defined for migration
- Sufficient for prototype evaluation

### Zod for Validation

**Rationale:**
- Type safety at runtime
- Executable documentation
- Easy test case generation
- Integration with AI SDK

### Decimal.js for Money

**Rationale:**
- Avoids floating-point errors
- Precise financial calculations
- Canadian rounding support
- Battle-tested library

## Known Limitations

1. **Prototype Database:** In-memory storage (production requires PostgreSQL)
2. **No Real OCR:** Receipt images not processed (mock data only)
3. **No External GST Verification:** Format validation only
4. **Simulated Agent Runtime:** Tool execution simulated in UI
5. **No Voice Interface:** Text-only
6. **Limited Test Coverage:** Domain logic only
7. **No Real Streaming:** Simulated in UI

## Future Architecture Evolution

### Phase 1: Complete Agent Integration
- Integrate real AI SDK for agent execution
- Implement streaming tool calls
- Add real-time state synchronization

### Phase 2: Production Database
- Migrate to PostgreSQL
- Add connection pooling
- Implement read replicas

### Phase 3: Enhanced Testing
- Comprehensive unit tests
- Integration tests for agent workflows
- E2E tests with Playwright
- Security test suite
- Agent evaluation dataset

### Phase 4: Advanced Features
- Receipt image/OCR pipeline
- Voice interface
- Multi-model fallback
- Persistent agent sessions
- Property-based testing

### Phase 5: Observability
- OpenTelemetry integration
- Metrics dashboard
- Alerting
- Performance optimization

## References

- CRA GST/HST Memorandum 1.4: Supporting Documentation
- CRA GST/HST Memorandum 3.2: Input Tax Credits
- CRA GST/HST Memorandum 3.3: Input Tax Credits - Restrictions
- OWASP Top 10 for LLM Applications
- NIST AI Risk Management Framework
- NIST Generative AI Profile
