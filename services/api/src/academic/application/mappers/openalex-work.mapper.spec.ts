import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { OpenAlexWorkRecord } from '@/academic/application/ports/openalex-work-source.port';

describe('transformOpenAlexWorkToArticleGraph', () => {
  it('maps an OpenAlex work into the internal article graph shape', () => {
    const work: OpenAlexWorkRecord = {
      id: 'https://openalex.org/W123',
      doi: 'https://doi.org/10.1234/example',
      display_name: 'A test work',
      publication_year: 2026,
      abstract_inverted_index: {
        A: [0],
        useful: [1],
        abstract: [2],
      },
      primary_location: {
        is_oa: true,
        source: {
          id: 'https://openalex.org/S456',
          display_name: 'Journal of Tests',
          type: 'journal',
          issn: ['1234-5678'],
          publisher: 'SciLab Press',
          country_code: 'US',
        },
      },
      authorships: [
        {
          author: {
            id: 'https://openalex.org/A789',
            display_name: 'Ada Lovelace',
          },
        },
      ],
      keywords: [
        {
          id: 'https://openalex.org/keywords/testing',
          display_name: 'testing',
          score: 0.9,
        },
      ],
      primary_topic: {
        id: 'https://openalex.org/T111',
        display_name: 'Software Testing',
        field: {
          display_name: 'Computer Science',
        },
      },
      topics: [
        {
          id: 'https://openalex.org/T111',
          display_name: 'Software Testing',
          score: 0.95,
        },
      ],
      referenced_works: ['https://openalex.org/W999'],
    };

    expect(transformOpenAlexWorkToArticleGraph(work)).toMatchObject({
      article: {
        id: 'W123',
        title: 'A test work',
        abstract: 'A useful abstract',
        doi: '10.1234/example',
        publicationYear: 2026,
      },
      journal: {
        id: 'S456',
        displayName: 'Journal of Tests',
        isOpenAccess: true,
        publisherName: 'SciLab Press',
      },
      authors: [
        {
          id: 'A789',
          displayName: 'Ada Lovelace',
          authorPosition: 1,
        },
      ],
      keywords: [
        {
          id: 'keywords/testing',
          displayName: 'testing',
          score: 0.9,
        },
      ],
      topics: [
        {
          id: 'T111',
          isPrimary: true,
        },
      ],
      citedArticleIds: ['W999'],
    });
  });
});
