import {text} from 'd3-request';
import {select, selectAll, Selection} from 'd3-selection';
import * as hljs from 'highlight.js';
import embed, {vega} from 'vega-embed';
import {vegaLite} from 'vega-tooltip';
import {runStreamingExample} from './streaming';

window['runStreamingExample'] = runStreamingExample;

declare const BASEURL: string;

function trim(str: string) {
  return str.replace(/^\s+|\s+$/g, '');
}

/* Anchors */
selectAll('h2, h3, h4, h5, h6').each(function(this: Element) {
  const sel = select(this);
  const name = sel.attr('id');
  const title = sel.text();
  sel.html('<a href="#' + name + '" class="anchor"><span class="octicon octicon-link"></span></a>' + trim(title));
});

/* Documentation */

function renderExample($target: Selection<any, any, any, any>, specText: string) {
  $target.classed('example', true);
  $target.text('');

  const vis = $target.append('div').attr('class', 'example-vis');

  // Decrease visual noise by removing $schema and description from code examples.
  const textClean = specText.replace(/(\s)+\"(\$schema|description)\": \".*?\",/g, '');
  const code = $target.append('pre').attr('class', 'example-code')
  .append('code').attr('class', 'json').text(textClean);
  hljs.highlightBlock(code.node() as any);

  const spec = JSON.parse(specText);

  embed(vis.node(), spec, {
    mode: 'vega-lite',
    renderer: 'svg',
    actions: {
      source: false,
      export: false
    },
    viewConfig: {
      loader: new vega.loader({
        baseURL: window.location.origin + BASEURL
      })
    }
  }).then(result => {
    if ($target.classed('tooltip')) {
      vegaLite(result.view, JSON.parse(specText) as any);
    }
  }).catch(console.error);
}

function getSpec(el: Element) {
  const sel = select(el);
  const name = sel.attr('data-name');
  if (name) {
    const dir = sel.attr('data-dir');
    const fullUrl = BASEURL + '/examples/specs/' + (dir ? (dir + '/') : '') + name + '.vl.json';

    text(fullUrl, function(error, spec) {
      if (error) {
        console.error(error);
      } else {
        renderExample(sel, spec);
      }
    });
  } else {
    console.error('No "data-name" specified to import examples from');
  }
}

window['changeSpec'] = function(elId: string, newSpec: string) {
  const el = document.getElementById(elId);
  select(el).attr('data-name', newSpec);
  getSpec(el);
};

window['buildSpecOpts'] = function(id: string, baseName: string) {
  const oldName = select('#' + id).attr('data-name');
  const prefixSel = select('select[name=' + id + ']');
  const inputsSel = selectAll('input[name=' + id + ']:checked');
  const prefix = prefixSel.empty() ? id : prefixSel.property('value');
  const values = inputsSel.nodes().map((n: any) => n.value).sort().join('_');
  const newName = baseName + prefix + (values ? '_' + values : '');
  if (oldName !== newName) {
    window['changeSpec'](id, newName);
  }
};

selectAll('.vl-example').each(function(this: Element) {
  getSpec(this);
});

// caroussel for the front page
// adapted from https://codepen.io/LANparty/pen/wePYXb

const carousel = document.getElementById('carousel');

function carouselHide(indicators: NodeListOf<any>, slides: NodeListOf<any>, num: number) {
  indicators[num].setAttribute('data-state', '');
  slides[num].setAttribute('data-state', '');

  slides[num].style.display='none';
}

function carouselShow(indicators: NodeListOf<any>, slides: NodeListOf<any>, num: number) {
  indicators[num].checked = true;
  indicators[num].setAttribute('data-state', 'active');
  slides[num].setAttribute('data-state', 'active');

  slides[num].style.display='block';
}

function setSlide(indicators: NodeListOf<Element>, slides: NodeListOf<Element>, slide: number) {
  return function() {
    // Reset all slides
    for (let i = 0; i < indicators.length; i++) {
      indicators[i].setAttribute('data-state', '');
      slides[i].setAttribute('data-state', '');

      carouselHide(indicators, slides, i);
    }

    // Set defined slide as active
    indicators[slide].setAttribute('data-state', 'active');
    slides[slide].setAttribute('data-state', 'active');
    carouselShow(indicators, slides, slide);
  };
}

function switchSlide(indicators: NodeListOf<Element>, slides: NodeListOf<Element>) {
  let nextSlide = 0;

  // Reset all slides
  for (let i = 0; i < indicators.length; i++) {
    // If current slide is active & NOT equal to last slide then increment nextSlide
    if ((indicators[i].getAttribute('data-state') === 'active') && (i !== (indicators.length-1))) {
      nextSlide = i + 1;
    }

    // Remove all active states & hide
    carouselHide(indicators, slides, i);
  }

  // Set next slide as active & show the next slide
  carouselShow(indicators, slides, nextSlide);
}

if (carousel) {
  const slides = carousel.querySelectorAll('.slide');
  const indicators = carousel.querySelectorAll('.indicator');

  for (let i = 0; i < indicators.length; i++) {
    indicators[i].addEventListener('click', setSlide(indicators, slides, i));
  }

  [].forEach.call(document.querySelectorAll('.next'), (n: Element) =>
    n.addEventListener('click', () => switchSlide(indicators, slides)));
}
