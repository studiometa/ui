### Added

- **Fetch:** add the `params` option, which adds query parameters to every request built from the destination
- **Fetch:** add the `historyMode` option, `push` by default or `replace`
- **Fetch:** add the `FetchRequest`, `FetchResponseDetail`, `FetchLoadResult`, `FetchOutcome` and `RestoreRecipe` types
- **Fetch:** add the `fetch.file-not-uploaded`, `fetch.invalid-history-mode` and `fetch.src-copy-of-page` diagnostics

### Changed

- ⚠️ **Fetch:** restore back and forward navigation through one history coordinator per page, with a recipe under the `fetch` key of `history.state`
- ⚠️ **Fetch:** make `src` a fixed endpoint that gives the origin and the path, with the query of the destination folded on
- ⚠️ **Fetch:** emit `fetch-after` last, after the DOM change, exactly once, with an `outcome`
- ⚠️ **Fetch:** remove the `fetch-fetch` and `fetch-update` events, and `FETCH_EVENTS.FETCH` and `FETCH_EVENTS.UPDATE`
- ⚠️ **Fetch:** replace `url` and `requestInit` in the event details with `request`, and give `response` as plain data
- ⚠️ **Fetch:** resolve `fetch(destination?)` with the outcome, without a `requestInit` argument
- ⚠️ **Fetch:** call the `client` with the request URL as a string and an upper-case method
- ⚠️ **Fetch:** remove the `url`, `historyUrl` and `requestInit` getters, replaced by the request in `fetch-before`
- ⚠️ **Fetch:** replace `update()`, `updateDOM()`, `error()`, `mergeRequestInit()` and `onWindowPopstate()` with the `__load()` and `__apply()` steps
- ⚠️ **Fetch:** give `request` to the `response` expression and to `parseResponse()`, instead of `url` and `requestInit`
- ⚠️ **Fetch:** write history for a POST only after a redirect
- ⚠️ **Fetch:** send a URL-encoded POST body by default, and the file itself only with `enctype="multipart/form-data"`
- ⚠️ **Fetch:** replace the query of the `action` of a GET form with its fields, as a native submission does
- ⚠️ **Fetch:** leave a link or a form with a `target` other than `_self` to the browser
- ⚠️ **Fetch:** remove the `FetchEventBase` type and the `headerEntries`, `headerNames` and `headerValue` helpers
- ⚠️ **Fetch:** give `request`, `response` and `content` in the `js-toolkit:dom:update` detail, instead of `url`, `requestInit` and `fragment`
- ⚠️ **Fetch:** let `abort()` leave a request that has started its DOM change or has failed
- ⚠️ **Fetch:** set `document.title` only when an entry is written or restored
- ⚠️ **Fetch:** write no history entry for an element that is neither a link nor a form, unless `fetch()` gets a destination
- ⚠️ **Fetch:** restore `append` and `prepend` content with `replace`
- ⚠️ **Fetch:** remove `HEADER_NAMES.ACCEPT` and `HEADER_NAMES.X_REQUESTED_BY`, which the component does not send
- ⚠️ **FetchShopifySection:** remove the `url` getter and the `fetch()`, `update()` and `__appendSections()` overrides, as `sections` now sets `params`
- ⚠️ **FetchShopifyPartial:** remove the `fetch()` override, `canUsePartials()` and `applyPartials()`, and give the partials update as the `content` of `fetch-update-before`

### Fixed

- **Fetch:** restore the right content on back and forward with `src`, with pagination and with Shopify sections
- **Fetch:** send one request for one `popstate`, however many elements write history
- **Fetch:** keep the `history.state` keys of other scripts, and ignore their entries
- **Fetch:** write the hash of the destination instead of keeping the current one
- **Fetch:** send the name and value of the submitter, and follow `formaction`, `formmethod`, `formenctype` and `dialog`
- **Fetch:** report a failed DOM change as `fetch-error`, also inside a view transition
- **Fetch:** never apply a superseded response
- **Fetch:** emit no `fetch-abort` for a request that has ended
- **Fetch:** read the `action`, `method` and `enctype` of a form that has controls with those names
- **Fetch:** leave links and forms to the browser under `<base target>`
- **Fetch:** send the line breaks of form fields as CRLF, as natively
- **Fetch:** replace the entry, instead of pushing one, for a navigation to the URL of the page
- **Fetch:** send no request on back to an anchor of the same page
- **FetchShopifyPartial:** stop the webpack warning on the import of `@shopify/partial-rendering`
