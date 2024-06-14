import { decorateMain } from '../../scripts/scripts.js';

import { loadBlocks } from '../../scripts/aem.js';

const OBJ_SELECTORS = {};
const SELECTORS = {
  columndivcards: '.card-mini-cards.columns-container',
  fragmentDiv: '.fragment-container.supportcontactsinfo-container',
};

function createElparallelToFirstSection() {
  const firstElement = document.querySelector('.section');
  // Create a new div element
  const newElement = document.createElement('div');
  newElement.className = 'fragment-and-card-parent';
  // Insert the new element after the first element
  firstElement.parentNode.insertBefore(newElement, firstElement.nextSibling);
  return newElement;
}

export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^='./media_']`).forEach((elem) => {
          elem[attr] = new URL(
            elem.getAttribute(attr),
            new URL(path, window.location),
          ).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadBlocks(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      block.closest('.supportcontactsinfo').replaceWith(...fragment.childNodes);
    }
  }
  const sectiondiv = document.querySelector(SELECTORS.fragmentDiv);
  const columndiv = document.querySelector(SELECTORS.columndivcards);
  OBJ_SELECTORS.sectiondiv = sectiondiv;
  OBJ_SELECTORS.columndiv = columndiv;
  const parentElfragments = createElparallelToFirstSection();
  parentElfragments.appendChild(OBJ_SELECTORS.sectiondiv);
  parentElfragments.appendChild(OBJ_SELECTORS.columndiv);
  OBJ_SELECTORS.sectiondiv.style.removeProperty('display');
  OBJ_SELECTORS.columndiv.style.removeProperty('display');
}
