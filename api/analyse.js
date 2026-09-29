import Anthropic from '@anthropic-ai/sdk';

/**
 * Read a set of photographs and describe the home in them.
 *
 * This is the part that makes the product honest. Before it existed the tour
 * was a floor plan from a slider with the agent's photographs hung on the walls
 * like pictures — the flat you walked through was not the flat in the pictures.
 * Now the photographs decide the rooms, their size, their colour, their floor,
 * their windows and what furniture stands against which wall, and the walk-
 * through is built from that.
 *
 * It runs on the server for one reason: the API key. Everything else in this
 * app is static and happily lives in the browser; a key cannot.
 */

/* The vocabulary the renderer knows how to draw. The model may only answer in
   these terms — anything outside them would arrive as a word we cannot build. */
const ROOM_KINDS = [
  'entry', 'hall', 'living', 'kitchen', 'dining', 'bedroom',
  'bathroom', 'wc', 'balcony', 'study', 'utility',
];
const FLOOR_KINDS = ['wood', 'tile', 'stone', 'carpet', 'vinyl', 'concrete'];
const FURNITURE_KINDS = [
  'bed', 'wardrobe', 'bedside', 'sofa', 'armchair', 'coffee-table',
  'dining-table', 'tv', 'rug', 'bookshelf', 'desk', 'counter', 'island',
  'fridge', 'shower', 'bathtub', 'wc', 'vanity', 'plant',
];
const WALLS = ['left', 'right', 'far', 'near', 'centre'];

const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['rooms', 'order', 'summaryHe', 'summaryEn', 'readable'],
  properties: {
    readable: {
      type: 'boolean',
      description:
        'False if the photographs do not show the inside of a home well enough to model it.',
    },
    summaryHe: { type: 'string', description: 'One sentence in Hebrew describing the home.' },
    summaryEn: { type: 'string', description: 'One sentence in English describing the home.' },
    order: {
      type: 'array',
      description:
        'Room ids in the order you would meet them walking in from the front door. Every room id appears exactly once.',
      items: { type: 'string' },
    },
    rooms: {
      type: 'array',
      minItems: 1,
      maxItems: 9,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id', 'kind', 'nameHe', 'nameEn', 'widthM', 'depthM', 'ceilingM',
          'wallColor', 'floor', 'windows', 'furniture', 'fromPhotos',
        ],
        properties: {
          id: { type: 'string', description: 'A short slug, unique across rooms, e.g. "living" or "bedroom2".' },
          kind: { type: 'string', enum: ROOM_KINDS },
          nameHe: { type: 'string' },
          nameEn: { type: 'string' },
          widthM: {
            type: 'number',
            description:
              'Width in metres, judged against things of known size in the photo — a door is about 0.8m, a double bed 1.6m, a kitchen worktop 0.6m deep, a standard tile 0.6m.',
          },
          depthM: { type: 'number', description: 'Depth in metres, judged the same way.' },
          ceilingM: { type: 'number', description: 'Ceiling height in metres, usually 2.4 to 3.0.' },
          wallColor: { ...hex, description: 'The dominant wall colour as it would look under neutral light.' },
          floor: {
            type: 'object',
            additionalProperties: false,
            required: ['kind', 'color'],
            properties: {
              kind: { type: 'string', enum: FLOOR_KINDS },
              color: hex,
            },
          },
          windows: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['wall', 'widthM', 'sillM', 'headM'],
              properties: {
                wall: { type: 'string', enum: WALLS },
                widthM: { type: 'number' },
                sillM: { type: 'number', description: 'Height of the bottom of the window above the floor.' },
                headM: { type: 'number', description: 'Height of the top of the window above the floor.' },
              },
            },
          },
          furniture: {
            type: 'array',
            maxItems: 8,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['kind', 'wall', 'color', 'lengthM'],
              properties: {
                kind: { type: 'string', enum: FURNITURE_KINDS },
                wall: { type: 'string', enum: WALLS },
                color: hex,
                lengthM: { type: 'number', description: 'Its longest horizontal dimension in metres.' },
              },
            },
          },
          fromPhotos: {
            type: 'array',
            description: 'Indexes of the photographs this room was read from, 0-based.',
            items: { type: 'integer' },
          },
        },
      },
    },
  },
};

const SYSTEM = `You are a surveyor who turns photographs of a home into a floor plan that can be walked through in 3D.

You are given photographs of one property, in no particular order. Work out what you are looking at:

- Group the photographs by room. Two photographs of the same room from different corners are one room, not two. Look at the floor, the wall colour, the doorways and the window positions to decide.
- Give every room a size in metres. You cannot measure, so judge against things whose size you know: an interior door is about 0.8m wide and 2.0m tall, a kitchen worktop is 0.6m deep and 0.9m high, a double bed is 1.6m by 2.0m, a single 0.9m, a toilet 0.7m deep, a floor tile commonly 0.3m or 0.6m. Say what you actually see; a small bathroom should come out small.
- Read the colours off the surfaces as they would look under neutral daylight, not under the warm bulb or the blue cast of the photograph.
- List only furniture you can actually see, with the wall it stands against. 'far' is the wall opposite the door you enter by, 'near' is the wall the door is in, 'left' and 'right' are as you face into the room from that door, 'centre' is free-standing.
- Order the rooms as someone walking in from the front door would meet them: entrance first, then the rooms off the hall, with the living space last. If there is no photograph of an entrance or hall, do not invent a room for it — just start with what you have.

Do not invent rooms that no photograph shows. It is better to return three rooms that are right than six with three guessed. If the photographs are not of the inside of a home, or are too dark or too few to read, set readable to false and return an empty room list.`;

/** Anything the model could not have got right anyway, clamped to something buildable. */
const clamp = (v, lo, hi, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
};

function sanitise(observation) {
  const rooms = (observation.rooms || [])
    .filter((r) => r && r.id)
    .slice(0, 9)
    .map((r) => ({
      ...r,
      // a room smaller than a wardrobe or larger than a hall is a misread, not a room
      widthM: clamp(r.widthM, 1.2, 9, 3),
      depthM: clamp(r.depthM, 1.2, 11, 3.4),
      ceilingM: clamp(r.ceilingM, 2.2, 3.6, 2.6),
      windows: (r.windows || []).slice(0, 3).map((w) => ({
        ...w,
        widthM: clamp(w.widthM, 0.4, 6, 1.2),
        sillM: clamp(w.sillM, 0, 1.6, 0.9),
        headM: clamp(w.headM, 1.0, 3.2, 2.2),
      })),
      furniture: (r.furniture || []).slice(0, 8).map((f) => ({
        ...f,
        lengthM: clamp(f.lengthM, 0.2, 4, 1),
      })),
    }));

  const ids = new Set(rooms.map((r) => r.id));
  const order = (observation.order || []).filter((id) => ids.has(id));
  // anything the model left out of the order still has to exist somewhere
  for (const r of rooms) if (!order.includes(r.id)) order.push(r.id);

  return { ...observation, rooms, order };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'not-configured' });
  }

  const photos = Array.isArray(req.body?.photos) ? req.body.photos.slice(0, 8) : [];
  // only our own storage: this endpoint must not become a way to make the
  // server fetch arbitrary URLs
  const allowed = photos.filter(
    (u) => typeof u === 'string' && /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//.test(u)
  );
  if (!allowed.length) {
    return res.status(400).json({ error: 'no-photos' });
  }

  const client = new Anthropic();

  try {
    const message = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: SYSTEM,
      // spatial judgement from photographs is exactly the kind of work that
      // repays thinking; the default effort on this model is a notch lower
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: [
            ...allowed.map((url) => ({ type: 'image', source: { type: 'url', url } })),
            {
              type: 'text',
              text: `These ${allowed.length} photographs are of one property, numbered 0 to ${allowed.length - 1} in the order given. Survey it.`,
            },
          ],
        },
      ],
    });

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'refused', detail: message.stop_details?.category ?? null });
    }

    const text = message.content.find((b) => b.type === 'text')?.text;
    if (!text) return res.status(502).json({ error: 'empty-response' });

    const observation = sanitise(JSON.parse(text));
    if (!observation.readable || !observation.rooms.length) {
      return res.status(422).json({ error: 'unreadable' });
    }

    // the browser rebuilds the model on every load; the answer never changes
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(observation);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy' });
    if (err instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: 'not-configured' });
    if (err instanceof SyntaxError) return res.status(502).json({ error: 'bad-json' });
    console.error('analyse failed', err);
    return res.status(500).json({ error: 'failed' });
  }
}
