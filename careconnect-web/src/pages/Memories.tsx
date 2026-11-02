import { useState } from 'react';
import { Pin, Users, MapPin, Calendar, Leaf, Heart, type LucideIcon } from 'lucide-react';
import { memoryCards } from '../data/mockData';
import type { MemoryCard } from '../types';

const categoryConfig: Record<
  MemoryCard['category'],
  { label: string; Icon: LucideIcon }
> = {
  family:  { label: 'Family',  Icon: Users },
  place:   { label: 'Place',   Icon: MapPin },
  event:   { label: 'Memory',  Icon: Calendar },
  hobby:   { label: 'Hobby',   Icon: Leaf },
  pet:     { label: 'Pet',     Icon: Heart },
};

const filterLabels: Array<{ key: MemoryCard['category'] | 'all'; label: string }> = [
  { key: 'all',    label: 'All' },
  { key: 'family', label: 'Family' },
  { key: 'place',  label: 'Places' },
  { key: 'event',  label: 'Memories' },
  { key: 'hobby',  label: 'Hobbies' },
  { key: 'pet',    label: 'Pets' },
];

export default function Memories() {
  const [filter, setFilter] = useState<MemoryCard['category'] | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = memoryCards.filter(
    (c) => filter === 'all' || c.category === filter
  );

  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Memories</h1>
        <p className="text-neutral-500 mt-1">
          People, places, and moments that matter to you
        </p>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div role="group" aria-label="Filter memories by category">
        <div className="flex flex-wrap gap-2">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`btn text-sm px-4 py-2 min-h-0 h-10 ${
                filter === key ? 'btn-primary' : 'btn-secondary'
              }`}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pinned cards ─────────────────────────────────────────────────── */}
      {pinned.length > 0 && (
        <section aria-label="Pinned memories">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            <Pin className="w-4 h-4" aria-hidden="true" />
            Pinned
          </h2>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 lg:items-stretch">
            {pinned.map((card) => (
              <MemoryCardItem
                key={card.id}
                card={card}
                expanded={expanded === card.id}
                onToggle={() => setExpanded(expanded === card.id ? null : card.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Other cards ──────────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <section aria-label="More memories">
          {pinned.length > 0 && (
            <h2 className="text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              More memories
            </h2>
          )}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 lg:items-stretch">
            {rest.map((card) => (
              <MemoryCardItem
                key={card.id}
                card={card}
                expanded={expanded === card.id}
                onToggle={() => setExpanded(expanded === card.id ? null : card.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="card text-center py-14 text-neutral-500">
          <p className="text-lg font-medium">No memories in this category yet.</p>
        </div>
      )}
    </div>
  );
}

function MemoryCardItem({
  card,
  expanded,
  onToggle,
}: {
  card: MemoryCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { Icon, label } = categoryConfig[card.category];

  return (
    <article className="card card-hover overflow-hidden p-0 h-full flex flex-col">
      {/* Photo — fixed 16:9 aspect box so subjects aren't cropped awkwardly
          and every card's image is the same height. */}
      {card.imageUrl && (
        <div className="w-full aspect-[16/9] overflow-hidden bg-neutral-100">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-calm text-xs">
                <Icon className="w-3 h-3" aria-hidden="true" />
                {label}
              </span>
              {card.pinned && (
                <span className="badge badge-neutral text-xs">
                  <Pin className="w-3 h-3" aria-hidden="true" />
                  Pinned
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-neutral-800 leading-tight">
              {card.title}
            </h3>
          </div>
        </div>

        {/* Body with expand/collapse for long text */}
        <div>
          <p
            className={`text-neutral-600 text-base leading-relaxed ${
              !expanded ? 'line-clamp-3' : ''
            }`}
            id={`memory-body-${card.id}`}
          >
            {card.body}
          </p>
          {card.body.length > 120 && (
            <button
              onClick={onToggle}
              className="mt-2 text-sm font-medium text-calm-600 hover:text-calm-700 underline underline-offset-2 bg-transparent border-0 p-0 h-auto min-h-0 min-w-0 cursor-pointer"
              aria-expanded={expanded}
              aria-controls={`memory-body-${card.id}`}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
