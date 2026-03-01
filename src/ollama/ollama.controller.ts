import { Body, Controller, Post } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { OllamaTripsService } from './ollama-trips.service';
import { SuggestTripDto } from './dto/suggest-trip.dto';

@Controller('ollama')
export class OllamaController {
  constructor(
    private readonly ollama: OllamaService,
    private readonly ollamaTrips: OllamaTripsService,
  ) {}

  @Post('suggest-trip')
  suggestTrip(@Body() dto: SuggestTripDto) {
    return this.ollamaTrips.suggestTrip(dto);
  }

  @Post('chat')
  async chat(@Body() body: { messages: { role: string; content: string }[] }) {
    if (!body?.messages?.length) {
      return {
        content:
          'Send { "messages": [ { "role": "user", "content": "..." } ] }',
      };
    }
    const content = await this.ollama.chat(
      body.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    );
    return { content };
  }

  /** Generate embedding vector(s) for text. Dimension depends on OLLAMA_EMBED_MODEL (e.g. 768 for nomic-embed-text). */
  @Post('embed')
  async embed(
    @Body() body: { input: string | string[]; model?: string },
  ): Promise<{ embeddings: number[][] }> {
    if (!body?.input) {
      return {
        embeddings: [],
      };
    }
    const embeddings = await this.ollama.embed(
      body.input,
      body.model,
    );
    return { embeddings };
  }
}
