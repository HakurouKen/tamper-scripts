// ==UserScript==
// @run-at document-end
// @grant GM_setValue
// @grant GM_getValue
// @match https://www.ntdm9.com/*
// @match https://www.ntdm.tv/*
// ==/UserScript==

import { create, getById, select } from './dom';
import { Series } from './history';
import { createHistoryManager } from './manager';

createHistoryManager({
  id: 'ntdm',
  index: (url) => url.pathname === '/',
  series: (url) => /\/play\/(?:[\d-]+).html/.test(url.pathname),
  matchSeries(url) {
    const id = url.pathname.match(/\/play\/(\d+)-/)?.[1];
    return {
      id,
      title: getById('detailname').innerText || '',
      cover: getById('play_poster_img').getAttribute('src') || '',
      latest: {
        title: (select('#content .active-play').innerText || '').trim(),
        url: url.href
      }
    };
  },
  render(series) {
    if (!series.length) {
      return;
    }

    const container = select('.div_left.baseblock');

    const createItemHtml = (item: Series) => {
      return `
      <li class="anime_icon1">
        <a href="${item.latest.url}">
          <img referrerpolicy="no-referrer" width="120px" height="165px" class="anime_icon1_img" src="${item.cover}" alt="${item.title}" title="${item.latest.title}">
          <span class="anime_icon1_name1">看到${item.latest.title}</span>
        </a>
        <a class="anime_icon1_name_a" href="${item.latest.url}">
          <div class="anime_icon1_name">${item.title}</div>
        </a>
      </li>
      `;
    };

    const html = `
    <div class="blocktitle">
      <a href="javascript:void(0);">最近观看</a>
    </div>
    <div class="blockcontent">
      <ul class="ul_li_a5">
        ${series.map(createItemHtml).join('')}
      </ul>
    </div>
    <hr class="hrspace clear" style="width: 98%;">`;

    const wrapper = create('div');
    wrapper.innerHTML = html;
    container.prepend(...wrapper.children);
  }
});
