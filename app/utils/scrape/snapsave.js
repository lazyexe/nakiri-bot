import * as cheerio from 'cheerio';
import got from 'got';

export const snapsave = async function(url) {
  let code = await got
    .post('https://snapsave.app/action.php', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://snapsave.app',
        referer: 'https://snapsave.app/?lang=id',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      },
      form: { url },
    })
    .text();

  code = decryptSnapSaveData(code);
  const htmlContentMatch = code.match(
    /document\.getElementById\("download-section"\)\.innerHTML = "(.*)";/
  );

  if (htmlContentMatch && htmlContentMatch[1]) {
    code = htmlContentMatch[1];
    code = code.replace(/\\(\\)?/g, '');

    const $ = cheerio.load(code);
    const results = [];

    const title = $('.content > p > strong').text() || undefined;
    const description = $('span.video-des').text() || undefined;

    if ($('div.download-items').length) {
      $('div.download-items').each((_, el) => {
        const $el = $(el);
        const url = $el.find('.download-items__btn > a').attr('href');
        const thumbUrl = new URL(
          $el.find('.download-items__thumb > img').attr('src')
        );
        const thumb =
          thumbUrl.searchParams.get('photo') || thumbUrl.toString();
        results.push({
          thumbnail: thumb,
          url,
        });
      });
    } else if ($('table.table').length) {
      const thumbnail = $('figure > .image > img').attr('src') || undefined;
      $('tbody > tr').each((_, el) => {
        const $el = $(el);
        const $td = $el.find('td');
        const resolution = $td.eq(0).text();
        let _url =
          $td.eq(2).find('a').attr('href') ||
          $td.eq(2).find('button').attr('onclick');
        const shouldRender = /get_progressApi/gi.test(_url || '');
        if (shouldRender) {
          _url = /get_progressApi\('(.*?)'\)/.exec(_url || '')?.[1] || _url;
        }
        results.push({
          resolution,
          thumbnail,
          url: _url,
          shouldRender,
        });
      });
    } else {
      const thumbnail = $('figure > .image > img').attr('src');
      const url = $('div.column > a').attr('href');
      results.push({
        thumbnail,
        url,
      });
    }

    return {
      ok: true,
      data: {
        title,
        description,
        resolutions: results,
      },
    };
  } else {
    return {
      ok: false,
      message: 'Failed to get metadata',
    };
  }
};

function decryptSnapSaveData(obfuscatedDataString) {
  const args = obfuscatedDataString
    .split('decodeURIComponent(escape(r))}(')[1]
    .split('))')[0]
    .split(',')
    .map(v => v.replace(/"/g, '').trim());

  // eslint-disable-next-line no-unused-vars
  let [h, u, n, t, e, r] = args;
  function customBaseDecode(encodedString, inputBase, outputBase) {
    const chars =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split(
        ''
      );
    const inputChars = chars.slice(0, inputBase);
    const outputChars = chars.slice(0, outputBase);

    let decimalValue = encodedString
      .split('')
      .reverse()
      .reduce((accumulator, char, index) => {
        if (inputChars.includes(char)) {
          return (
            accumulator + inputChars.indexOf(char) * Math.pow(inputBase, index)
          );
        }
        return accumulator;
      }, 0);

    let result = '';
    while (decimalValue > 0) {
      result = outputChars[decimalValue % outputBase] + result;
      decimalValue = (decimalValue - (decimalValue % outputBase)) / outputBase;
    }
    return result || '0';
  }

  let decryptedString = '';
  for (let i = 0; i < h.length; i++) {
    let segment = '';
    while (h[i] !== n[e] && i < h.length) {
      segment += h[i];
      i++;
    }
    for (let j = 0; j < n.length; j++) {
      segment = segment.replace(new RegExp(n[j], 'g'), j.toString());
    }
    decryptedString += String.fromCharCode(
      customBaseDecode(segment, parseInt(e), 10) - parseInt(t)
    );
  }
  return decodeURIComponent(encodeURIComponent(decryptedString));
}