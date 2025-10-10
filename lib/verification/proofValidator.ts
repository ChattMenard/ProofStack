import crypto from 'crypto'

export type Proof = {
  proof_hash: string
  timestamp: string
  payload: any
}

/**
 * Generate a simple deterministic proof hash for a skill <-> sample linkage.
 * This can later be extended to produce signed attestations or append-only chains.
 */
export function generateProof(skillName: string, userId: string, sampleId: string, evidence: any) : Proof {
  const timestamp = new Date().toISOString()
  // create a stable payload
  const payload = { skill: skillName, user_id: userId, sample_id: sampleId, evidence, timestamp }
  const s = JSON.stringify(payload)
  const hash = crypto.createHash('sha256').update(s).digest('hex')
  return { proof_hash: hash, timestamp, payload }
}

export default generateProof
