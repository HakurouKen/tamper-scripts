import { logger } from './logger';
import { type Series, useHistory } from './history';
import { VIEWED_TIMEOUT } from './constants';

type PageMatcher = (url: URL) => boolean;
type RawPageMatcher = string | RegExp | PageMatcher;

function normalizePageMatcher(matcher: RawPageMatcher): PageMatcher {
  if (typeof matcher === 'string') {
    return (url: URL) => url.href === matcher;
  }

  if (typeof (matcher as RegExp).test === 'function') {
    return (url: URL) => (matcher as RegExp).test(url.href);
  }

  return matcher as PageMatcher;
}

export function createHistoryManager(options: {
  id: string;
  index: PageMatcher;
  render: (series: Series[]) => void;
  series: PageMatcher;
  matchSeries: (url: URL, document: Document) => Series;
}) {
  const indexPageMatcher = normalizePageMatcher(options.index);
  const seriesPageMatcher = normalizePageMatcher(options.series);
  const { render, matchSeries, id } = options;
  const history = useHistory(id);
  const url = new URL(window.location.href);

  if (indexPageMatcher(url)) {
    logger.log('Index Page matched, render %o', history.list());
    render(history.list());
    return;
  }
  if (seriesPageMatcher(url)) {
    const series = matchSeries(url, document);
    logger.log('Series page matched, push state %o', series);
    setTimeout(() => {
      history.add(series);
    }, VIEWED_TIMEOUT);
    return;
  }
}
