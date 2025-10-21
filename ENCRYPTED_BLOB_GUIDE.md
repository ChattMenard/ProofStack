# Encrypted Blob Utility

A secure Python utility for creating encrypted blobs with AES-GCM encryption and Ed25519 digital signatures.

## Features

- **AES-GCM Encryption**: Industry-standard authenticated encryption for data confidentiality and integrity
- **Ed25519 Signatures**: Fast, secure digital signatures for metadata authenticity
- **Key Rotation**: Interval-based key derivation for automatic key rotation
- **Tamper Detection**: Cryptographic integrity checks prevent data tampering
- **Age Validation**: Optional maximum age checks for time-sensitive data

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or install directly:

```bash
pip install cryptography>=42.0.0
```

## Quick Start

### Basic Usage

```python
from tools.encrypted_blob import (
    create_encrypted_blob,
    decrypt_and_verify_blob,
    generate_keypair
)
import os

# Generate keys (do this once and store securely)
master_key = os.urandom(32)  # 256-bit master key
signing_key, verify_key = generate_keypair()

# Encrypt data
data = b"Sensitive information to protect"
blob = create_encrypted_blob(data, master_key, signing_key)

# Decrypt and verify
decrypted_data, metadata = decrypt_and_verify_blob(
    blob, master_key, verify_key
)

print(f"Decrypted: {decrypted_data.decode()}")
```

### With Additional Metadata

```python
# Include additional metadata
blob = create_encrypted_blob(
    data=b"Secret message",
    master_key=master_key,
    signing_key=signing_key,
    additional_metadata={
        "user_id": "user123",
        "purpose": "secure_message",
        "classification": "confidential"
    }
)

decrypted_data, metadata = decrypt_and_verify_blob(
    blob, master_key, verify_key
)

print(f"User: {metadata['additional']['user_id']}")
print(f"Purpose: {metadata['additional']['purpose']}")
```

### With Age Validation

```python
# Only accept blobs created within the last hour
try:
    decrypted_data, metadata = decrypt_and_verify_blob(
        blob,
        master_key,
        verify_key,
        max_age_seconds=3600  # 1 hour
    )
except ValueError as e:
    print(f"Blob is too old: {e}")
```

## Key Management

### Generating Keys

```python
from tools.encrypted_blob import generate_keypair
import os

# Generate master key for encryption
master_key = os.urandom(32)

# Generate Ed25519 keypair for signing
signing_key, verify_key = generate_keypair()
```

### Storing Keys Securely

```python
from tools.encrypted_blob import (
    serialize_private_key,
    serialize_public_key,
    load_private_key,
    load_public_key
)
from base64 import b64encode, b64decode

# Serialize keys for storage
master_key_b64 = b64encode(master_key).decode()
signing_key_bytes = serialize_private_key(signing_key)
verify_key_bytes = serialize_public_key(verify_key)

# Store securely (e.g., environment variables, key vault, etc.)
# DO NOT commit keys to version control!

# Later, load keys back
master_key = b64decode(master_key_b64)
signing_key = load_private_key(signing_key_bytes)
verify_key = load_public_key(verify_key_bytes)
```

### Key Rotation

The utility supports automatic key rotation using interval-based key derivation:

```python
# Keys are automatically rotated based on time intervals
# Default interval: 1 hour (3600 seconds)
blob = create_encrypted_blob(
    data,
    master_key,
    signing_key,
    interval_seconds=3600  # Custom interval
)

# Decryption automatically uses the correct interval key
decrypted_data, _ = decrypt_and_verify_blob(
    blob,
    master_key,
    verify_key,
    interval_seconds=3600  # Must match encryption interval
)
```

## API Reference

### Core Functions

#### `create_encrypted_blob(data, master_key, signing_key, interval_seconds=3600, additional_metadata=None)`

Creates an encrypted blob with signed metadata.

**Parameters:**
- `data` (bytes): Raw data to encrypt
- `master_key` (bytes): 32-byte master key for encryption
- `signing_key` (Ed25519PrivateKey): Private key for signing metadata
- `interval_seconds` (int, optional): Key rotation interval (default: 3600)
- `additional_metadata` (dict, optional): Additional metadata to include

**Returns:** Dictionary with base64-encoded fields:
- `ciphertext`: Encrypted data
- `nonce`: AES-GCM nonce
- `metadata`: Signed metadata (includes interval, timestamp, version)
- `signature`: Ed25519 signature

**Raises:** `EncryptionError` if encryption fails

#### `decrypt_and_verify_blob(blob, master_key, verify_key, max_age_seconds=None, interval_seconds=3600)`

Decrypts and verifies an encrypted blob.

**Parameters:**
- `blob` (dict): Encrypted blob dictionary
- `master_key` (bytes): 32-byte master key for decryption
- `verify_key` (Ed25519PublicKey): Public key for signature verification
- `max_age_seconds` (int, optional): Maximum allowed age (None for no limit)
- `interval_seconds` (int, optional): Key rotation interval (default: 3600)

**Returns:** Tuple of (decrypted_data, metadata)

**Raises:**
- `SignatureError`: Signature verification failed
- `DecryptionError`: Decryption failed
- `ValueError`: Blob is too old or malformed

### Key Management Functions

#### `generate_keypair()`

Generates a new Ed25519 keypair.

**Returns:** Tuple of (private_key, public_key)

#### `serialize_private_key(private_key)` / `load_private_key(key_bytes)`

Serialize and load Ed25519 private keys.

#### `serialize_public_key(public_key)` / `load_public_key(key_bytes)`

Serialize and load Ed25519 public keys.

### Utility Functions

#### `derive_interval_key(master_key, interval, salt=b"proofstack-key-derivation")`

Derives an encryption key for a specific time interval.

#### `get_current_interval(timestamp=None, interval_seconds=3600)`

Calculates the current time interval.

## Security Considerations

### Best Practices

1. **Key Storage**: Store keys securely using environment variables, key vaults, or hardware security modules
2. **Key Rotation**: Use appropriate interval lengths based on your security requirements
3. **Age Validation**: Set `max_age_seconds` for time-sensitive data
4. **Transport Security**: Use TLS/SSL when transmitting encrypted blobs
5. **Access Control**: Limit access to master keys and signing keys

### Security Features

- **Authenticated Encryption**: AES-GCM provides both confidentiality and integrity
- **Strong Signatures**: Ed25519 provides 128-bit security level
- **Tamper Detection**: Any modification to ciphertext or metadata will be detected
- **Key Isolation**: Separate keys for encryption and signing
- **Forward Secrecy**: Interval-based key derivation limits exposure

### Threats Mitigated

✅ Data tampering (authenticated encryption)  
✅ Metadata forgery (digital signatures)  
✅ Replay attacks (with age validation)  
✅ Key compromise (with key rotation)  
✅ Cryptanalysis (industry-standard algorithms)

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
python tools/test_encrypted_blob.py

# Or use pytest (if installed)
pytest tools/test_encrypted_blob.py -v
```

## Example: Complete Workflow

```python
#!/usr/bin/env python3
"""Complete example of encrypted blob workflow."""

import os
from base64 import b64encode
from tools.encrypted_blob import (
    create_encrypted_blob,
    decrypt_and_verify_blob,
    generate_keypair,
    serialize_private_key,
    serialize_public_key
)

# 1. Initial setup (do once)
print("Generating keys...")
master_key = os.urandom(32)
signing_key, verify_key = generate_keypair()

# Store keys securely (example: print for demo only)
print(f"Master key: {b64encode(master_key).decode()}")
print(f"Signing key: {b64encode(serialize_private_key(signing_key)).decode()}")
print(f"Verify key: {b64encode(serialize_public_key(verify_key)).decode()}")

# 2. Encrypt sensitive data
print("\nEncrypting data...")
sensitive_data = b"User credit card: 1234-5678-9012-3456"
blob = create_encrypted_blob(
    data=sensitive_data,
    master_key=master_key,
    signing_key=signing_key,
    additional_metadata={
        "user_id": "user_12345",
        "data_type": "payment_info",
        "classification": "PCI-DSS"
    }
)

print(f"Encrypted blob created")
print(f"Ciphertext length: {len(blob['ciphertext'])}")

# 3. Store or transmit blob (as JSON)
import json
blob_json = json.dumps(blob)
print(f"\nBlob JSON: {blob_json[:100]}...")

# 4. Later: decrypt and verify
print("\nDecrypting and verifying...")
decrypted_data, metadata = decrypt_and_verify_blob(
    blob=blob,
    master_key=master_key,
    verify_key=verify_key,
    max_age_seconds=3600  # Only accept blobs < 1 hour old
)

print(f"✓ Signature verified")
print(f"✓ Data integrity confirmed")
print(f"Data classification: {metadata['additional']['classification']}")
print(f"Decrypted: {decrypted_data.decode()}")
```

## Running the Example

```bash
# Run the built-in example
python tools/encrypted_blob.py

# Expected output:
# Encrypted Blob Utility - Example Usage
# ==================================================
# 
# 1. Generating keys...
# 2. Creating encrypted blob...
# 3. Decrypting and verifying blob...
# 4. Verifying data integrity...
#    ✓ Data integrity verified successfully!
# 5. Testing signature verification failure...
#    ✓ Correctly detected invalid signature!
```

## Integration with ProofStack

This utility can be integrated into ProofStack for:

- **Secure Storage**: Encrypt sensitive user data before storing in database
- **API Security**: Encrypt data in API responses for sensitive endpoints
- **Worker Communication**: Secure data passed to background workers
- **Backup Security**: Encrypt backup data with automatic key rotation
- **Compliance**: Meet encryption requirements for PCI-DSS, GDPR, etc.

### Example: Encrypting Work Samples

```python
# In a ProofStack API route or worker
from tools.encrypted_blob import create_encrypted_blob, decrypt_and_verify_blob

# Encrypt a work sample before storage
encrypted_sample = create_encrypted_blob(
    data=work_sample_data,
    master_key=get_master_key(),  # From secure storage
    signing_key=get_signing_key(),
    additional_metadata={
        "user_id": user.id,
        "sample_type": "portfolio_item",
        "uploaded_at": datetime.now().isoformat()
    }
)

# Store encrypted_sample in database
store_encrypted_sample(encrypted_sample)
```

## Troubleshooting

### Common Issues

**ImportError: No module named 'cryptography'**
- Solution: `pip install cryptography>=42.0.0`

**ValueError: Master key must be 32 bytes**
- Solution: Use `os.urandom(32)` to generate proper key

**SignatureError: Signature verification failed**
- Check: Using correct verify key
- Check: Blob hasn't been tampered with
- Check: Using same key that signed the blob

**DecryptionError: Decryption failed**
- Check: Using correct master key
- Check: Ciphertext hasn't been modified
- Check: interval_seconds matches encryption

**ValueError: Blob is too old**
- Solution: Adjust `max_age_seconds` or regenerate blob

## License

Part of ProofStack. See LICENSE file for details.

## Support

For issues or questions:
1. Check this documentation
2. Run the test suite to verify installation
3. Review the example code in `tools/encrypted_blob.py`
4. Open an issue on GitHub
