import {
  buildScimagoDataset,
  parseScimagoRecord,
} from '@/academic/domain/scimago.model';

describe('SCImago model helpers', () => {
  it('parses normalized values and derives a year-aware dictionary', () => {
    const record = parseScimagoRecord({
      Year: '2025',
      Sourceid: '28773',
      Title: 'Example Journal',
      Type: 'journal',
      Issn: '15424863, 00079235',
      SJR: '104,065',
      'H index': '236',
      Rank: '1',
      'SJR Best Quartile': 'Q1',
      'Total Docs. (2025)': '43',
      'Total Docs. (3years)': '124',
      'Total Refs.': '3952',
      'Total Citations (3years)': '35985',
      'Citable Docs. (3years)': '89',
      'Citations / Doc. (2years)': '387,59',
      'Ref. / Doc.': '91,91',
      '%Female': '45,26',
      Country: 'United States',
      Categories: 'Oncology (Q1)',
      Areas: 'Medicine',
    });
    const dataset = buildScimagoDataset([record]);

    expect(record).toMatchObject({
      issns: ['1542-4863', '0007-9235'],
      sjr: 104.065,
      hIndex: 236,
      rank: 1,
      type: 'journal',
      totalDocs: 43,
      citationsPerDoc2Years: 387.59,
      refsPerDoc: 91.91,
      femalePercentage: 45.26,
      countryCode: 'US',
    });
    expect(dataset.dictionary.get('2025|1542-4863')).toEqual([record]);
    expect(dataset.subjectCategories).toEqual([
      { displayName: 'Oncology', subjectAreaName: 'Medicine' },
    ]);
  });

  it('keeps ISSN collisions instead of overwriting them', () => {
    const first = parseScimagoRecord({
      Year: '2025',
      Sourceid: '1',
      Title: 'One',
      Issn: '15424863',
      SJR: '',
      'H index': '',
      Rank: '1',
      'SJR Best Quartile': '',
      Categories: '',
      Areas: '',
    });
    const second = { ...first, sourceId: '2', title: 'Two' };
    const dataset = buildScimagoDataset([first, second]);

    expect(dataset.dictionary.get('2025|1542-4863')).toEqual([first, second]);
  });
});
