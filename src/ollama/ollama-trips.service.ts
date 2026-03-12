import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OllamaService } from './ollama.service';
import { SuggestTripDto } from './dto/suggest-trip.dto';

interface AiStop {
  cityName: string;
  hotelName?: string | null;
  days?: number;
  activityNames?: string[];
  placeNames?: string[];
}

interface AiSuggestion {
  suggestion: string;
  name: string;
  stops: AiStop[];
}

@Injectable()
export class OllamaTripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  /**
   * Build context (countries, cities, places, hotels, activities) for Ollama.
   */
  private async buildTripContext(dto: SuggestTripDto): Promise<string> {
    const countries = await this.prisma.country.findMany({
      include: {
        cities: {
          orderBy: { name: 'asc' },
          include: {
            places: { take: 30, orderBy: { name: 'asc' } },
            hotels: {
              take: 20,
              orderBy: { name: 'asc' },
              include: { roomTypes: { select: { pricePerNight: true } } },
            },
          },
        },
      },
    });

    const activities = await this.prisma.activity.findMany({
      take: 100,
      include: { place: { include: { city: true } } },
    });

    let startCityName: string | null = null;
    let endCityName: string | null = null;
    if (dto.startCityId) {
      const c = await this.prisma.city.findUnique({
        where: { id: dto.startCityId },
        select: { name: true },
      });
      startCityName = c?.name ?? null;
    }
    if (dto.endCityId) {
      const c = await this.prisma.city.findUnique({
        where: { id: dto.endCityId },
        select: { name: true },
      });
      endCityName = c?.name ?? null;
    }

    const lines: string[] = [
      '# Countries, cities, places and hotels',
      '',
      ...countries.map(
        (co) =>
          `## ${co.name}\nCities: ${co.cities.map((c) => c.name).join(', ')}\n` +
          co.cities
            .map(
              (c) =>
                `- **${c.name}**: places: ${c.places.map((p) => p.name).join(', ') || 'none'}; hotels: ${c.hotels.map((h) => {
                const minPrice = h.roomTypes?.length
                  ? Math.min(...h.roomTypes.map((rt) => rt.pricePerNight))
                  : null;
                return minPrice != null ? `${h.name} (from ${minPrice}/night)` : h.name;
              }).join(', ') || 'none'}`,
            )
            .join('\n'),
      ),
      '',
      '# Activities (with place and city)',
      ...activities.map(
        (a) =>
          `- ${a.name} (place: ${a.place?.name ?? 'N/A'}, city: ${a.place?.city?.name ?? 'N/A'})`,
      ),
      '',
    ];

    if (startCityName) lines.push(`**Start city (required):** ${startCityName}\n`);
    if (endCityName) lines.push(`**End city (required):** ${endCityName}\n`);
    if (dto.maxPrice != null) lines.push(`**Maximum total price:** ${dto.maxPrice}\n`);

    return lines.join('\n');
  }

  /**
   * Parse AI response as JSON (strip markdown code block if present).
   */
  private parseJsonResponse(raw: string): AiSuggestion | null {
    let str = raw.trim();
    const codeBlock = str.match(/^```(?:json)?\s*([\s\S]*?)```$/);
    if (codeBlock) str = codeBlock[1].trim();
    try {
      return JSON.parse(str) as AiSuggestion;
    } catch {
      return null;
    }
  }

  /**
   * Resolve AI stop (names) to IDs using DB lookups.
   */
  private async resolveDraft(
    parsed: AiSuggestion,
    dto: SuggestTripDto,
  ): Promise<{
    name: string;
    price?: number;
    stops: Array<{
      cityId: string;
      hotelId?: string;
      days: number;
      activityIds?: string[];
      placeIds?: string[];
    }>;
  }> {
    const cities = await this.prisma.city.findMany({
      select: { id: true, name: true },
    });
    const cityByName = new Map(cities.map((c) => [c.name.toLowerCase().trim(), c.id]));

    const hotels = await this.prisma.hotel.findMany({
      select: { id: true, name: true, cityId: true },
    });
    const hotelByCityAndName = new Map<string, string>();
    for (const h of hotels) {
      hotelByCityAndName.set(`${h.cityId}:${h.name.toLowerCase().trim()}`, h.id);
    }

    const activities = await this.prisma.activity.findMany({
      select: { id: true, name: true },
    });
    const activityByName = new Map(activities.map((a) => [a.name.toLowerCase().trim(), a.id]));

    const places = await this.prisma.place.findMany({
      select: { id: true, name: true },
    });
    const placeByName = new Map(places.map((p) => [p.name.toLowerCase().trim(), p.id]));

    const stops: Array<{
      cityId: string;
      hotelId?: string;
      days: number;
      activityIds?: string[];
      placeIds?: string[];
    }> = [];

    for (const s of parsed.stops || []) {
      const cityId = cityByName.get((s.cityName || '').toLowerCase().trim());
      if (!cityId) continue;

      let hotelId: string | undefined;
      if (s.hotelName) {
        hotelId = hotelByCityAndName.get(`${cityId}:${s.hotelName.toLowerCase().trim()}`);
      }

      const activityIds: string[] = [];
      for (const name of s.activityNames || []) {
        const id = activityByName.get(name.toLowerCase().trim());
        if (id) activityIds.push(id);
      }

      const placeIds: string[] = [];
      for (const name of s.placeNames || []) {
        const id = placeByName.get(name.toLowerCase().trim());
        if (id) placeIds.push(id);
      }

      stops.push({
        cityId,
        hotelId,
        days: Math.max(1, Number(s.days) || 1),
        activityIds: activityIds.length ? activityIds : undefined,
        placeIds: placeIds.length ? placeIds : undefined,
      });
    }

    return {
      name: parsed.name || 'Suggested Trip',
      price: dto.maxPrice,
      stops,
    };
  }

  /**
   * Suggest a trip: returns human-readable text + structured draft for POST /trips on confirm.
   */
  async suggestTrip(
    dto: SuggestTripDto,
  ): Promise<{ suggestion: string; draft?: { name: string; price?: number; stops: Array<{ cityId: string; hotelId?: string; days: number; activityIds?: string[]; placeIds?: string[] }> } }> {
    if (!this.ollama.isEnabled()) {
      return {
        suggestion:
          'Ollama is disabled. Set OLLAMA_HOST and run Ollama locally, or set OLLAMA_DISABLED=false.',
      };
    }

    const context = await this.buildTripContext(dto);

    const systemPrompt = `You are a travel assistant for a tourism platform. You suggest trip itineraries using ONLY the data in the context.
Rules:
1. Use only city, hotel, activity and place names that appear exactly in the context.
2. Route must follow logical geographical order (e.g. Aleppo → Homs → Damascus).
3. If start/end city are specified, the itinerary must start and end there.
4. If max price is given, keep total cost within budget.
5. For each stop include one city, optional one hotel, and optional activities/places.
Respond with ONLY a valid JSON object, no other text. Use this exact structure (names must match context):
{"suggestion":"Markdown or plain text itinerary for the user to read","name":"Trip title","stops":[{"cityName":"City name from context","hotelName":"Hotel name or null","days":1,"activityNames":["Activity A"],"placeNames":["Place B"]}]}`;

    const userContent =
      'Context:\n' + context + '\n\nRespond with the JSON object only.';

    const raw = await this.ollama.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      { format: 'json' },
    );

    const parsed = this.parseJsonResponse(raw);
    if (!parsed || !parsed.stops?.length) {
      return { suggestion: raw || 'Could not generate suggestion.' };
    }

    const draft = await this.resolveDraft(parsed, dto);
    if (!draft.stops.length) {
      return { suggestion: parsed.suggestion || raw };
    }

    return {
      suggestion: parsed.suggestion || raw,
      draft: {
        name: draft.name,
        price: draft.price,
        stops: draft.stops,
      },
    };
  }
}
