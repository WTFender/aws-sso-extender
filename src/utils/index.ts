import extension from '../extension';
import { createFirefoxContainer } from './container';

function waitForElement<TElement extends Element = HTMLElement>(
  selector: string,
  options: {
    timeout?: number;
    parentNode?: ParentNode;
  } = {},
): Promise<TElement> {
  extension.log(`waitForElement:${selector}`);
  const { timeout = 3000, parentNode = document } = options;

  return new Promise((resolve, reject) => {
    const element = parentNode.querySelector<TElement>(selector);

    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.from(mutation.addedNodes).forEach((addedNode) => {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const targetElement = (addedNode as Element).querySelector<TElement>(selector);

            if (targetElement) {
              observer.disconnect();
              resolve(targetElement);
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element not found with selector "${selector}"`));
    }, timeout);
  });
}

function getFontColor(hexcolor): 'black' | 'white' {
  extension.log(hexcolor);
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 180) ? 'black' : 'white';
}

export {
  waitForElement, createFirefoxContainer, getFontColor,
};
