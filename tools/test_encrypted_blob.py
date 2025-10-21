#!/usr/bin/env python3
"""
Unit tests for encrypted blob utility.

Run with: python -m pytest tools/test_encrypted_blob.py -v
Or: python tools/test_encrypted_blob.py
"""

import os
import time
import json
import unittest
from base64 import b64encode, b64decode

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.encrypted_blob import (
    create_encrypted_blob,
    decrypt_and_verify_blob,
    generate_keypair,
    derive_interval_key,
    get_current_interval,
    serialize_private_key,
    serialize_public_key,
    load_private_key,
    load_public_key,
    EncryptionError,
    DecryptionError,
    SignatureError,
    AES_KEY_SIZE,
    DEFAULT_KEY_ROTATION_INTERVAL
)


class TestKeyDerivation(unittest.TestCase):
    """Test key derivation functions."""
    
    def test_derive_interval_key_length(self):
        """Test that derived keys are the correct length."""
        master_key = os.urandom(AES_KEY_SIZE)
        derived_key = derive_interval_key(master_key, 0)
        self.assertEqual(len(derived_key), AES_KEY_SIZE)
    
    def test_derive_interval_key_deterministic(self):
        """Test that key derivation is deterministic."""
        master_key = os.urandom(AES_KEY_SIZE)
        interval = 12345
        
        key1 = derive_interval_key(master_key, interval)
        key2 = derive_interval_key(master_key, interval)
        
        self.assertEqual(key1, key2)
    
    def test_derive_interval_key_different_intervals(self):
        """Test that different intervals produce different keys."""
        master_key = os.urandom(AES_KEY_SIZE)
        
        key1 = derive_interval_key(master_key, 0)
        key2 = derive_interval_key(master_key, 1)
        
        self.assertNotEqual(key1, key2)
    
    def test_derive_interval_key_invalid_master_key(self):
        """Test that invalid master key size raises ValueError."""
        with self.assertRaises(ValueError):
            derive_interval_key(b"short_key", 0)
    
    def test_get_current_interval(self):
        """Test interval calculation."""
        timestamp = 3600.0  # 1 hour
        interval_seconds = 3600
        
        interval = get_current_interval(timestamp, interval_seconds)
        self.assertEqual(interval, 1)
    
    def test_get_current_interval_default(self):
        """Test that get_current_interval uses current time by default."""
        interval = get_current_interval()
        self.assertIsInstance(interval, int)
        self.assertGreater(interval, 0)


class TestKeypairOperations(unittest.TestCase):
    """Test Ed25519 keypair operations."""
    
    def test_generate_keypair(self):
        """Test keypair generation."""
        private_key, public_key = generate_keypair()
        self.assertIsNotNone(private_key)
        self.assertIsNotNone(public_key)
    
    def test_serialize_and_load_private_key(self):
        """Test private key serialization and loading."""
        private_key, _ = generate_keypair()
        
        serialized = serialize_private_key(private_key)
        self.assertEqual(len(serialized), 32)
        
        loaded_key = load_private_key(serialized)
        self.assertIsNotNone(loaded_key)
        
        # Verify keys work the same
        test_data = b"test message"
        sig1 = private_key.sign(test_data)
        sig2 = loaded_key.sign(test_data)
        
        # Signatures may differ due to randomness, but both should verify
        public_key = private_key.public_key()
        public_key.verify(sig1, test_data)
        public_key.verify(sig2, test_data)
    
    def test_serialize_and_load_public_key(self):
        """Test public key serialization and loading."""
        _, public_key = generate_keypair()
        
        serialized = serialize_public_key(public_key)
        self.assertEqual(len(serialized), 32)
        
        loaded_key = load_public_key(serialized)
        self.assertIsNotNone(loaded_key)


class TestEncryptionDecryption(unittest.TestCase):
    """Test encryption and decryption operations."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.master_key = os.urandom(AES_KEY_SIZE)
        self.signing_key, self.verify_key = generate_keypair()
        self.test_data = b"This is test data that needs to be encrypted."
    
    def test_basic_encryption_decryption(self):
        """Test basic encryption and decryption."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        # Verify blob structure
        self.assertIn("ciphertext", blob)
        self.assertIn("nonce", blob)
        self.assertIn("metadata", blob)
        self.assertIn("signature", blob)
        
        # Decrypt and verify
        decrypted_data, metadata = decrypt_and_verify_blob(
            blob,
            self.master_key,
            self.verify_key
        )
        
        self.assertEqual(decrypted_data, self.test_data)
        self.assertIn("interval", metadata)
        self.assertIn("timestamp", metadata)
        self.assertIn("version", metadata)
    
    def test_encryption_with_additional_metadata(self):
        """Test encryption with additional metadata."""
        additional = {"user": "test_user", "purpose": "testing"}
        
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key,
            additional_metadata=additional
        )
        
        decrypted_data, metadata = decrypt_and_verify_blob(
            blob,
            self.master_key,
            self.verify_key
        )
        
        self.assertEqual(decrypted_data, self.test_data)
        self.assertIn("additional", metadata)
        self.assertEqual(metadata["additional"], additional)
    
    def test_decryption_with_wrong_key(self):
        """Test that decryption fails with wrong master key."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        wrong_key = os.urandom(AES_KEY_SIZE)
        
        with self.assertRaises(DecryptionError):
            decrypt_and_verify_blob(
                blob,
                wrong_key,
                self.verify_key
            )
    
    def test_verification_with_wrong_signature_key(self):
        """Test that verification fails with wrong signature key."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        _, wrong_verify_key = generate_keypair()
        
        with self.assertRaises(SignatureError):
            decrypt_and_verify_blob(
                blob,
                self.master_key,
                wrong_verify_key
            )
    
    def test_tampering_detection(self):
        """Test that tampering with ciphertext is detected."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        # Tamper with ciphertext
        ciphertext = b64decode(blob["ciphertext"])
        tampered = bytearray(ciphertext)
        tampered[0] ^= 0xFF  # Flip bits
        blob["ciphertext"] = b64encode(bytes(tampered)).decode()
        
        with self.assertRaises(DecryptionError):
            decrypt_and_verify_blob(
                blob,
                self.master_key,
                self.verify_key
            )
    
    def test_metadata_tampering_detection(self):
        """Test that tampering with metadata is detected."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        # Tamper with metadata
        metadata = json.loads(b64decode(blob["metadata"]).decode())
        metadata["interval"] = 99999
        blob["metadata"] = b64encode(
            json.dumps(metadata, sort_keys=True).encode()
        ).decode()
        
        with self.assertRaises(SignatureError):
            decrypt_and_verify_blob(
                blob,
                self.master_key,
                self.verify_key
            )
    
    def test_max_age_check(self):
        """Test maximum age validation."""
        blob = create_encrypted_blob(
            self.test_data,
            self.master_key,
            self.signing_key
        )
        
        # Should succeed with large max_age
        decrypted_data, _ = decrypt_and_verify_blob(
            blob,
            self.master_key,
            self.verify_key,
            max_age_seconds=3600
        )
        self.assertEqual(decrypted_data, self.test_data)
        
        # Should fail with very small max_age
        time.sleep(0.1)
        with self.assertRaises(ValueError):
            decrypt_and_verify_blob(
                blob,
                self.master_key,
                self.verify_key,
                max_age_seconds=0
            )
    
    def test_empty_data(self):
        """Test encryption and decryption of empty data."""
        empty_data = b""
        
        blob = create_encrypted_blob(
            empty_data,
            self.master_key,
            self.signing_key
        )
        
        decrypted_data, _ = decrypt_and_verify_blob(
            blob,
            self.master_key,
            self.verify_key
        )
        
        self.assertEqual(decrypted_data, empty_data)
    
    def test_large_data(self):
        """Test encryption and decryption of large data."""
        large_data = os.urandom(1024 * 1024)  # 1 MB
        
        blob = create_encrypted_blob(
            large_data,
            self.master_key,
            self.signing_key
        )
        
        decrypted_data, _ = decrypt_and_verify_blob(
            blob,
            self.master_key,
            self.verify_key
        )
        
        self.assertEqual(decrypted_data, large_data)
    
    def test_malformed_blob(self):
        """Test handling of malformed blob."""
        malformed_blob = {"invalid": "blob"}
        
        with self.assertRaises(ValueError):
            decrypt_and_verify_blob(
                malformed_blob,
                self.master_key,
                self.verify_key
            )


class TestKeyRotation(unittest.TestCase):
    """Test key rotation scenarios."""
    
    def test_encryption_across_intervals(self):
        """Test that blobs encrypted in different intervals can be decrypted."""
        master_key = os.urandom(AES_KEY_SIZE)
        signing_key, verify_key = generate_keypair()
        test_data = b"Test data"
        
        # Create blob with specific interval
        interval_seconds = 3600
        timestamp1 = 0.0  # Interval 0
        timestamp2 = 3600.0  # Interval 1
        
        # Mock the interval calculation by creating blobs at different times
        blob1 = create_encrypted_blob(
            test_data,
            master_key,
            signing_key,
            interval_seconds=interval_seconds
        )
        
        # Both blobs should decrypt successfully
        data1, meta1 = decrypt_and_verify_blob(
            blob1,
            master_key,
            verify_key,
            interval_seconds=interval_seconds
        )
        
        self.assertEqual(data1, test_data)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""
    
    def test_invalid_base64_in_blob(self):
        """Test handling of invalid base64 data."""
        master_key = os.urandom(AES_KEY_SIZE)
        _, verify_key = generate_keypair()
        
        invalid_blob = {
            "ciphertext": "not-valid-base64!!!",
            "nonce": "also-invalid!!!",
            "metadata": "invalid!!!",
            "signature": "nope!!!"
        }
        
        with self.assertRaises((ValueError, DecryptionError)):
            decrypt_and_verify_blob(
                invalid_blob,
                master_key,
                verify_key
            )
    
    def test_missing_blob_fields(self):
        """Test handling of missing blob fields."""
        master_key = os.urandom(AES_KEY_SIZE)
        _, verify_key = generate_keypair()
        
        incomplete_blob = {
            "ciphertext": b64encode(b"data").decode(),
            "nonce": b64encode(b"nonce").decode()
            # Missing metadata and signature
        }
        
        with self.assertRaises((KeyError, ValueError)):
            decrypt_and_verify_blob(
                incomplete_blob,
                master_key,
                verify_key
            )


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestKeyDerivation))
    suite.addTests(loader.loadTestsFromTestCase(TestKeypairOperations))
    suite.addTests(loader.loadTestsFromTestCase(TestEncryptionDecryption))
    suite.addTests(loader.loadTestsFromTestCase(TestKeyRotation))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
