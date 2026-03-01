import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Ollama } from 'ollama';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OllamaService {
  private readonly client: Ollama;
  private readonly chatModel: string;
  private readonly embedModel: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOptional<string>(
      'OLLAMA_HOST',
      'http://127.0.0.1:11434',
    );
    this.chatModel =
      this.configService.getOptional<string>('OLLAMA_CHAT_MODEL') ?? 'llama3.2';
    this.embedModel =
      this.configService.getOptional<string>('OLLAMA_EMBED_MODEL') ??
      'nomic-embed-text';
    this.enabled = this.configService.getOptional<string>('OLLAMA_DISABLED') !== 'true';
    this.client = new Ollama({ host });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a chat request to Ollama (trip suggestions, Q&A, etc.)
   * @param format - 'json' to request JSON response (model may still return text)
   */
  async chat(
    messages: OllamaChatMessage[],
    options?: { format?: 'json' },
  ): Promise<string> {
    if (!this.enabled) {
      return 'Ollama is disabled. Set OLLAMA_DISABLED to false and run Ollama (e.g. ollama run llama3.2).';
    }
    try {
      const response = await this.client.chat({
        model: this.chatModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        format: options?.format,
      });
      return response.message?.content ?? '';
    } catch (err: unknown) {
      const ex = err as any;
      const msg = typeof ex?.message === 'string' ? ex.message : String(err);
      const cause = ex?.cause?.code ?? ex?.code;
      if (msg.includes('not found') || ex?.status_code === 404) {
        throw new BadRequestException(
          `Chat model '${this.chatModel}' not found. Pull it with: ollama pull ${this.chatModel}`,
        );
      }
      if (cause === 'ECONNREFUSED' || msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        const host = this.configService.getOptional<string>('OLLAMA_HOST', 'http://127.0.0.1:11434');
        throw new ServiceUnavailableException(
          `Cannot connect to Ollama at ${host}. Start Ollama (e.g. run "ollama serve" or start the Ollama app).`,
        );
      }
      throw err;
    }
  }

  /**
   * Generate embedding vector for text (e.g. place/activity description).
   * Dimension depends on model (e.g. nomic-embed-text returns 768).
   */
  async embed(input: string | string[], model?: string): Promise<number[][]> {
    if (!this.enabled) {
      throw new Error('Ollama is disabled.');
    }
    const m = model ?? this.embedModel;
    const response = await this.client.embed({
      model: m,
      input,
    });
    const embeddings = response.embeddings;
    if (!embeddings || embeddings.length === 0) {
      throw new Error('Ollama returned no embeddings.');
    }
    return embeddings as number[][];
  }

  /**
   * Single-text embedding (convenience).
   */
  async embedOne(text: string, model?: string): Promise<number[]> {
    const vectors = await this.embed(text, model);
    return vectors[0];
  }
}
