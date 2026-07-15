# Journal Rankings API Contract

`GET /academic/journal-rankings?year=<year>` remains authenticated and returns
the standard response envelope. Each item adds:

```json
{
  "scimagoSourceId": "28773",
  "journalId": "S123456789",
  "issns": ["1542-4863", "0007-9235"],
  "matchStatus": "MATCHED"
}
```

`journalId` is `null` for `PENDING`, `UNMATCHED`, `CONFLICT`, and
`OUT_OF_SCOPE`. Rankings outside the latest journal catalog are `OUT_OF_SCOPE`.
The existing journal and article endpoints consume `journalId`; no ISSN article
filter is introduced.
