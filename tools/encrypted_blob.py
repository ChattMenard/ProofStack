#!/usr/bin/env python3
"""
Secure encrypted blob utility using AES-GCM encryption and Ed25519 signing.

This module provides functions to create and verify encrypted blobs with:
- AES-GCM encryption for data confidentiality and integrity
- Ed25519 signatures for metadata authenticity
- Interval-based key derivation for key rotation

Usage:
    from tools.encrypted_blob import create_encrypted_blob, decrypt_and_verify_blob
    
    # Encrypt data
    blob = create_encrypted_blob(data, master_key, signing_key)
    
    # Decrypt and verify
    decrypted_data = decrypt_and_verify_blob(blob, master_key, verify_key)
"""

import os
import json
import time
import hmac
import hashlib
from typing import Dict, Any, Optional, Tuple
from base64 import b64encode, b64decode

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey,
        Ed25519PublicKey
    )
    from cryptography.hazmat.primitives import serialization
except ImportError as e:
    raise ImportError(
        "cryptography package is required. Install it with: pip install cryptography"
    ) from e


# Configuration
DEFAULT_KEY_ROTATION_INTERVAL = 3600  # 1 hour in seconds
AES_KEY_SIZE = 32  # 256 bits


class EncryptionError(Exception):
    """Base exception for encryption-related errors."""
    pass


class DecryptionError(Exception):
    """Base exception for decryption-related errors."""
    pass


class SignatureError(Exception):
    """Exception for signature verification failures."""
    pass


def derive_interval_key(
    master_key: bytes,
    interval: int,
    salt: bytes = b"proofstack-key-derivation"
) -> bytes:
    """
    Derive an encryption key for a specific time interval.
    
    Args:
        master_key: Master key for derivation (must be 32 bytes)
        interval: Time interval identifier
        salt: Additional salt for key derivation
        
    Returns:
        Derived 256-bit encryption key
        
    Raises:
        ValueError: If master_key is not 32 bytes
    """
    if len(master_key) != AES_KEY_SIZE:
        raise ValueError(f"Master key must be {AES_KEY_SIZE} bytes")
    
    # Use HMAC-based key derivation
    kdf_input = salt + interval.to_bytes(8, 'big')
    derived_key = hmac.new(master_key, kdf_input, hashlib.sha256).digest()
    
    return derived_key


def get_current_interval(
    timestamp: Optional[float] = None,
    interval_seconds: int = DEFAULT_KEY_ROTATION_INTERVAL
) -> int:
    """
    Get the current time interval for key rotation.
    
    Args:
        timestamp: Unix timestamp (defaults to current time)
        interval_seconds: Length of each interval in seconds
        
    Returns:
        Current interval number
    """
    if timestamp is None:
        timestamp = time.time()
    
    return int(timestamp // interval_seconds)


def create_encrypted_blob(
    data: bytes,
    master_key: bytes,
    signing_key: Ed25519PrivateKey,
    interval_seconds: int = DEFAULT_KEY_ROTATION_INTERVAL,
    additional_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Create an encrypted blob with signed metadata.
    
    Args:
        data: Raw data to encrypt
        master_key: Master key for encryption (32 bytes)
        signing_key: Ed25519 private key for signing metadata
        interval_seconds: Key rotation interval in seconds
        additional_metadata: Optional additional metadata to include
        
    Returns:
        Dictionary containing encrypted blob with base64-encoded fields:
        - ciphertext: Encrypted data
        - nonce: AES-GCM nonce
        - interval: Key derivation interval
        - timestamp: Creation timestamp
        - metadata: Additional metadata (if provided)
        - signature: Ed25519 signature of metadata
        
    Raises:
        EncryptionError: If encryption fails
    """
    try:
        # Get current interval and derive key
        timestamp = time.time()
        interval = get_current_interval(timestamp, interval_seconds)
        derived_key = derive_interval_key(master_key, interval)
        
        # Generate nonce (96 bits for GCM)
        nonce = os.urandom(12)
        
        # Encrypt data using AES-GCM
        aesgcm = AESGCM(derived_key)
        ciphertext = aesgcm.encrypt(nonce, data, None)
        
        # Create metadata
        metadata = {
            "interval": interval,
            "timestamp": timestamp,
            "version": "1.0"
        }
        
        if additional_metadata:
            metadata["additional"] = additional_metadata
        
        # Sign metadata with Ed25519
        metadata_json = json.dumps(metadata, sort_keys=True).encode('utf-8')
        signature = signing_key.sign(metadata_json)
        
        # Return blob with base64-encoded values
        return {
            "ciphertext": b64encode(ciphertext).decode('utf-8'),
            "nonce": b64encode(nonce).decode('utf-8'),
            "metadata": b64encode(metadata_json).decode('utf-8'),
            "signature": b64encode(signature).decode('utf-8')
        }
        
    except Exception as e:
        raise EncryptionError(f"Failed to create encrypted blob: {e}") from e


def decrypt_and_verify_blob(
    blob: Dict[str, str],
    master_key: bytes,
    verify_key: Ed25519PublicKey,
    max_age_seconds: Optional[int] = None,
    interval_seconds: int = DEFAULT_KEY_ROTATION_INTERVAL
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Decrypt and verify an encrypted blob.
    
    Args:
        blob: Encrypted blob dictionary with base64-encoded fields
        master_key: Master key for decryption (32 bytes)
        verify_key: Ed25519 public key for signature verification
        max_age_seconds: Maximum allowed age of blob (None for no limit)
        interval_seconds: Key rotation interval in seconds
        
    Returns:
        Tuple of (decrypted_data, metadata)
        
    Raises:
        DecryptionError: If decryption fails
        SignatureError: If signature verification fails
        ValueError: If blob is too old or malformed
    """
    try:
        # Decode base64 fields
        ciphertext = b64decode(blob["ciphertext"])
        nonce = b64decode(blob["nonce"])
        metadata_json = b64decode(blob["metadata"])
        signature = b64decode(blob["signature"])
        
        # Verify signature first
        try:
            verify_key.verify(signature, metadata_json)
        except Exception as e:
            raise SignatureError(f"Signature verification failed: {e}") from e
        
        # Parse metadata
        metadata = json.loads(metadata_json.decode('utf-8'))
        interval = metadata["interval"]
        timestamp = metadata["timestamp"]
        
        # Check age if specified
        if max_age_seconds is not None:
            age = time.time() - timestamp
            if age > max_age_seconds:
                raise ValueError(
                    f"Blob is too old: {age:.1f}s > {max_age_seconds}s"
                )
        
        # Derive key for the stored interval
        derived_key = derive_interval_key(master_key, interval)
        
        # Decrypt data using AES-GCM
        aesgcm = AESGCM(derived_key)
        try:
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        except Exception as e:
            raise DecryptionError(f"Decryption failed: {e}") from e
        
        return plaintext, metadata
        
    except (KeyError, json.JSONDecodeError) as e:
        raise ValueError(f"Malformed blob: {e}") from e
    except (SignatureError, DecryptionError, ValueError):
        raise
    except Exception as e:
        raise DecryptionError(f"Failed to decrypt blob: {e}") from e


def generate_keypair() -> Tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    """
    Generate a new Ed25519 keypair for signing.
    
    Returns:
        Tuple of (private_key, public_key)
    """
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


def serialize_private_key(private_key: Ed25519PrivateKey) -> bytes:
    """
    Serialize Ed25519 private key to bytes.
    
    Args:
        private_key: Ed25519 private key
        
    Returns:
        Serialized private key (32 bytes)
    """
    return private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )


def serialize_public_key(public_key: Ed25519PublicKey) -> bytes:
    """
    Serialize Ed25519 public key to bytes.
    
    Args:
        public_key: Ed25519 public key
        
    Returns:
        Serialized public key (32 bytes)
    """
    return public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )


def load_private_key(key_bytes: bytes) -> Ed25519PrivateKey:
    """
    Load Ed25519 private key from bytes.
    
    Args:
        key_bytes: Serialized private key (32 bytes)
        
    Returns:
        Ed25519 private key
    """
    return Ed25519PrivateKey.from_private_bytes(key_bytes)


def load_public_key(key_bytes: bytes) -> Ed25519PublicKey:
    """
    Load Ed25519 public key from bytes.
    
    Args:
        key_bytes: Serialized public key (32 bytes)
        
    Returns:
        Ed25519 public key
    """
    return Ed25519PublicKey.from_public_bytes(key_bytes)


def main():
    """
    Example usage demonstrating encryption and decryption.
    """
    print("Encrypted Blob Utility - Example Usage")
    print("=" * 50)
    
    # Generate keys
    print("\n1. Generating keys...")
    master_key = os.urandom(32)
    signing_key, verify_key = generate_keypair()
    print(f"   Master key: {b64encode(master_key).decode()[:40]}...")
    print(f"   Signing key generated")
    
    # Create encrypted blob
    print("\n2. Creating encrypted blob...")
    test_data = b"This is sensitive data that needs to be encrypted."
    blob = create_encrypted_blob(
        data=test_data,
        master_key=master_key,
        signing_key=signing_key,
        additional_metadata={"purpose": "example", "user": "demo"}
    )
    print(f"   Ciphertext: {blob['ciphertext'][:40]}...")
    print(f"   Nonce: {blob['nonce']}")
    
    # Decrypt and verify
    print("\n3. Decrypting and verifying blob...")
    decrypted_data, metadata = decrypt_and_verify_blob(
        blob=blob,
        master_key=master_key,
        verify_key=verify_key
    )
    print(f"   Decrypted data: {decrypted_data.decode()}")
    print(f"   Metadata: {json.dumps(metadata, indent=2)}")
    
    # Verify data integrity
    print("\n4. Verifying data integrity...")
    if decrypted_data == test_data:
        print("   ✓ Data integrity verified successfully!")
    else:
        print("   ✗ Data integrity check failed!")
    
    # Test signature verification failure
    print("\n5. Testing signature verification failure...")
    wrong_key, _ = generate_keypair()
    try:
        decrypt_and_verify_blob(blob, master_key, wrong_key.public_key())
        print("   ✗ Should have failed signature verification!")
    except SignatureError:
        print("   ✓ Correctly detected invalid signature!")
    
    print("\n" + "=" * 50)
    print("Example completed successfully!")


if __name__ == "__main__":
    main()
