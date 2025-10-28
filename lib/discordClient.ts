import { logApiCost } from './costTracking'

interface DiscordRole {
  id: string
  name: string
  color: number
}

interface DiscordMember {
  user: { id: string; username: string }
  roles: string[]
}

export class DiscordClient {
  private botToken: string

  constructor() {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN not configured')
    }
    this.botToken = token
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://discord.com/api/v10${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bot ${this.botToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Log Discord API usage for monitoring (Discord is free but track usage)
    await logApiCost({
      userId: 'system',
      provider: 'discord-api',
      modelName: 'discord-rest-api',
      operation: endpoint,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      status: response.ok ? 'success' : 'error',
      metadata: {
        endpoint,
        status: response.status,
        rateLimit: response.headers.get('x-ratelimit-remaining'),
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Discord API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    return this.fetch(`/guilds/${guildId}/roles`)
  }

  async createRole(guildId: string, name: string, color: number): Promise<DiscordRole> {
    return this.fetch(`/guilds/${guildId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name, color, hoist: true }),
    })
  }

  async addMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.fetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'PUT',
    })
  }

  async removeMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.fetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    })
  }

  async getMember(guildId: string, userId: string): Promise<DiscordMember> {
    return this.fetch(`/guilds/${guildId}/members/${userId}`)
  }
}

export const discordClient = new DiscordClient()
