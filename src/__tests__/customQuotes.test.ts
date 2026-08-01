import {
  DEFAULT_ATTRIBUTION,
  MAX_QUOTE_LENGTH,
  customAuthorId,
  customQuoteWith,
  isCustomQuote,
  makeCustomQuote,
  slugAttribution,
} from '@/src/customQuotes';
import { themesForQuote } from '@/src/data/authorsData';

/** A unit test for a pure module, sitting alongside the screen tests for locality. */

/**
 * A custom quote's `authorId` is a `custom:` slug with no author record behind
 * it, so its own tags are the only themes it can ever have.
 */
describe('Themes on a quote you wrote', () => {
  it('carries the themes it was given', () => {
    const quote = makeCustomQuote('Keep going', 'Ada Lovelace', ['courage', 'resilience']);
    expect(themesForQuote(quote)).toEqual(['courage', 'resilience']);
  });

  it('leaves the field off entirely when nothing was chosen', () => {
    // Shaped exactly like a quote written before themes existed, so the two need
    // no migration to tell apart.
    const quote = makeCustomQuote('Keep going', 'Ada Lovelace');
    expect('themes' in quote).toBe(false);
    expect(themesForQuote(quote)).toEqual([]);
  });

  it('drops duplicates rather than storing a theme twice', () => {
    expect(makeCustomQuote('Keep going', 'Ada', ['hope', 'hope']).themes).toEqual(['hope']);
  });

  it('lets an edit clear every theme back off', () => {
    // The failure this guards: merging into what was stored, which would make the
    // last theme impossible to remove.
    const tagged = makeCustomQuote('Keep going', 'Ada', ['hope']);
    const cleared = customQuoteWith(tagged.id, 'Keep going', 'Ada', []);
    expect('themes' in cleared).toBe(false);
    expect(themesForQuote(cleared)).toEqual([]);
  });

  it('still inherits an author\'s themes for a built-in quote', () => {
    // Themes stay a fact about the writer for the catalogue; only custom quotes
    // carry their own.
    expect(themesForQuote({ authorId: 'seneca' })).toContain('stoicism');
  });
});

describe('makeCustomQuote', () => {
  it('marks the quote as the user\'s own', () => {
    const quote = makeCustomQuote('Keep going', 'Ada Lovelace');
    expect(quote.authorId).toBe('custom:ada-lovelace');
    expect(quote.authorName).toBe('Ada Lovelace');
    expect(quote.text).toBe('Keep going');
    expect(isCustomQuote(quote)).toBe(true);
  });

  it('does not mistake a built-in quote for a custom one', () => {
    expect(isCustomQuote({ authorId: 'einstein' })).toBe(false);
    // No built-in author id contains a colon, so the prefix cannot collide.
    expect(isCustomQuote({ authorId: 'lao-tzu' })).toBe(false);
  });

  it('gives every quote a distinct id', () => {
    const a = makeCustomQuote('One', 'Someone');
    const b = makeCustomQuote('Two', 'Someone');
    expect(a.id).not.toBe(b.id);
  });

  it('trims and caps the text', () => {
    expect(makeCustomQuote('   padded   ', 'X').text).toBe('padded');
    const long = 'a'.repeat(MAX_QUOTE_LENGTH + 120);
    expect(makeCustomQuote(long, 'X').text).toHaveLength(MAX_QUOTE_LENGTH);
  });
});

describe('attribution grouping', () => {
  it('gives the same author id to the same attribution', () => {
    // This is what lets the author-grouped view collect a person's quotes into
    // one row rather than scattering them.
    expect(makeCustomQuote('One', 'Ada Lovelace').authorId).toBe(makeCustomQuote('Two', 'Ada Lovelace').authorId);
  });

  it('gives different author ids to different attributions', () => {
    expect(makeCustomQuote('One', 'Ada').authorId).not.toBe(makeCustomQuote('Two', 'Grace').authorId);
  });

  it('collapses case and punctuation so near-identical spellings group together', () => {
    expect(slugAttribution('Ada  Lovelace!')).toBe('ada-lovelace');
    expect(customAuthorId('J. Smith')).toBe(customAuthorId('J Smith'));
  });
});

describe('a missing attribution', () => {
  // The fallback is applied to the attribution itself, not just the id, so a card
  // can never display one thing while being grouped under another.
  it.each([['blank', ''], ['whitespace', '   '], ['punctuation only', '???']])(
    'falls back to Anonymous for %s, keeping name and id in step',
    (_label, attribution) => {
      const quote = makeCustomQuote('Something', attribution);
      expect(quote.authorName).toBe(DEFAULT_ATTRIBUTION);
      expect(quote.authorId).toBe('custom:anonymous');
    },
  );
});

describe('customQuoteWith', () => {
  it('keeps the id so collections and delivery history stay attached', () => {
    const original = makeCustomQuote('Before', 'Ada');
    const edited = customQuoteWith(original.id, 'After', 'Grace');
    expect(edited.id).toBe(original.id);
    expect(edited.text).toBe('After');
    expect(edited.authorId).toBe('custom:grace');
  });
});
