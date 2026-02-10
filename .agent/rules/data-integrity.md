---
trigger: model_decision
description: Data integrity rules for multi-entity relationships (platforms, accounts, tasks)
---

# Data Integrity Rules

Apply these rules when implementing features involving multi-entity relationships (e.g., accounts ↔ platforms, files ↔ tasks).

## Core Principle

**UI filtering ≠ Data filtering**. Always validate data at both layers:
1. **Frontend**: Filter in UI for better UX
2. **Backend**: Validate before processing for data integrity

## Multi-Platform Publishing

When publishing to multiple platforms with multiple accounts:

### ✅ Correct Pattern
```javascript
// Filter accounts BY PLATFORM before sending
accountList: selectedAccounts
  .filter(id => getAccount(id).platform === platformMap[targetPlatform])
  .map(id => getAccount(id).filePath)
```

### ❌ Anti-Pattern
```javascript
// Sending ALL accounts to EVERY platform
accountList: selectedAccounts.map(id => getAccount(id).filePath)
```

## Backend Validation

Always add defensive validation in API endpoints:

```python
# Validate account-platform match
for account_file in account_list:
    account_type = get_account_type(account_file)
    if account_type != target_platform:
        log_warning(f"Filtered mismatched account: {account_file}")
        continue  # or return 400
```

## Testing Requirements

For multi-entity features, include edge case tests:
- Mixed entity types (e.g., accounts from different platforms)
- Empty filtered results
- All entities match vs. none match
